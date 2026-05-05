import { Errors } from '@core/errors/errors'
import { KnittoError } from '@core/errors/knitto-error'
import type { AstNestAddBootstrapCallOperation, AstBootstrapExpression } from '@core/generation/ast-operation'
import { Node, SyntaxKind, type Block, type CallExpression, type Expression, type SourceFile } from 'ts-morph'

type EnsureBootstrapCallInput = {
  sourceFile: SourceFile
  appVar: string
  call: AstNestAddBootstrapCallOperation['call']
}

export class NestBootstrapEditor {
  ensureBootstrapCall({ sourceFile, appVar, call }: EnsureBootstrapCallInput): void {
    const bootstrapFunction = sourceFile.getFunction('bootstrap')

    if (!bootstrapFunction) {
      throw new KnittoError(
        'Could not find a bootstrap() function in the source file.',
        Errors.AST_BOOTSTRAP_FUNCTION_NOT_FOUND
      )
    }

    const bootstrapBody = bootstrapFunction.getBody()

    if (!bootstrapBody || !Node.isBlock(bootstrapBody)) {
      throw new KnittoError(
        'Could not find a bootstrap() function in the source file.',
        Errors.AST_BOOTSTRAP_FUNCTION_NOT_FOUND
      )
    }

    const appDeclaration = bootstrapBody
      .getDescendantsOfKind(SyntaxKind.VariableDeclaration)
      .find((declaration) => {
        return (
          declaration.getName() === appVar &&
          declaration.getFirstAncestorByKind(SyntaxKind.Block) === bootstrapBody
        )
      })

    if (!appDeclaration) {
      throw new KnittoError(
        `Could not find ${appVar} variable declaration in bootstrap() scope.`,
        Errors.AST_BOOTSTRAP_APP_VAR_NOT_FOUND
      )
    }

    const createCall = this.getNestFactoryCreateCall(appDeclaration.getInitializer())

    if (!createCall) {
      throw new KnittoError(
        `Expected ${appVar} to be initialized by NestFactory.create(...) in bootstrap().`,
        Errors.AST_BOOTSTRAP_APP_VAR_NOT_NEST_FACTORY_CREATE
      )
    }

    this.assertLegalIdentifier(appVar, `Expected app variable "${appVar}" to be a legal identifier.`)
    this.assertLegalIdentifier(
      call.method,
      `Expected bootstrap call method "${call.method}" to be a legal identifier.`
    )

    if (this.hasEquivalentCall(bootstrapBody, appVar, call)) {
      return
    }

    const appStatement = appDeclaration.getVariableStatementOrThrow()
    const statementIndex = this.getInsertionStatementIndex(bootstrapBody, appStatement, appVar, call)

    bootstrapBody.insertStatements(statementIndex + 1, this.renderCallStatement(appVar, call))
  }

  private getInsertionStatementIndex(
    bootstrapBody: Block,
    appStatement: Node,
    appVar: string,
    call: AstNestAddBootstrapCallOperation['call']
  ): number {
    const statements = bootstrapBody.getStatements()
    const appStatementIndex = statements.findIndex((statement) => statement === appStatement)
    const latestRequiredDeclarationIndex = this.getLatestRequiredDeclarationIndex(
      bootstrapBody,
      appStatementIndex,
      appVar,
      call.arguments
    )

    let insertionIndex = Math.max(appStatementIndex, latestRequiredDeclarationIndex)

    for (let index = insertionIndex + 1; index < statements.length; index += 1) {
      const statement = statements[index]

      if (!statement || !Node.isExpressionStatement(statement)) {
        break
      }

      if (!this.parseBootstrapCall(statement.getExpression(), appVar)) {
        break
      }

      insertionIndex = index
    }

    return insertionIndex
  }

  private getLatestRequiredDeclarationIndex(
    bootstrapBody: Block,
    appStatementIndex: number,
    appVar: string,
    argumentsList: AstBootstrapExpression[]
  ): number {
    const referencedNames = new Set(this.collectReferencedIdentifiers(argumentsList))

    referencedNames.delete(appVar)

    if (referencedNames.size === 0) {
      return appStatementIndex
    }

    const statements = bootstrapBody.getStatements()
    let latestIndex = appStatementIndex

    for (let index = appStatementIndex + 1; index < statements.length; index += 1) {
      const statement = statements[index]

      if (!statement) {
        continue
      }

      const declaredNames = this.getStatementDeclaredNames(statement)

      if (declaredNames.some((name) => referencedNames.has(name))) {
        latestIndex = index
      }
    }

    return latestIndex
  }

  private getNestFactoryCreateCall(initializer: Node | undefined): CallExpression | undefined {
    if (!initializer) {
      return undefined
    }

    const createCall = this.unwrapExpression(initializer)?.asKind(SyntaxKind.CallExpression)

    if (!createCall) {
      return undefined
    }

    const expression = createCall.getExpression()

    if (!Node.isPropertyAccessExpression(expression)) {
      return undefined
    }

    if (expression.getExpression().getText() !== 'NestFactory') {
      return undefined
    }

    return expression.getName() === 'create' ? createCall : undefined
  }

  private unwrapExpression(node: Node): Expression | undefined {
    if (Node.isParenthesizedExpression(node)) {
      return this.unwrapExpression(node.getExpression())
    }

    if (Node.isAwaitExpression(node)) {
      return this.unwrapExpression(node.getExpression())
    }

    if (Node.isAsExpression(node)) {
      return this.unwrapExpression(node.getExpression())
    }

    if (Node.isTypeAssertion(node)) {
      return this.unwrapExpression(node.getExpression())
    }

    if (Node.isSatisfiesExpression(node)) {
      return this.unwrapExpression(node.getExpression())
    }

    if (Node.isNonNullExpression(node)) {
      return this.unwrapExpression(node.getExpression())
    }

    return Node.isExpression(node) ? node : undefined
  }

  private hasEquivalentCall(
    bootstrapBody: Block,
    appVar: string,
    expectedCall: AstNestAddBootstrapCallOperation['call']
  ): boolean {
    return bootstrapBody.getStatements().some((statement) => {
      if (!Node.isExpressionStatement(statement)) {
        return false
      }

      const existingCall = this.parseBootstrapCall(statement.getExpression(), appVar)

      return existingCall !== undefined && this.callsAreEquivalent(existingCall, expectedCall)
    })
  }

  private parseBootstrapCall(
    expression: Expression,
    appVar: string
  ): AstNestAddBootstrapCallOperation['call'] | undefined {
    if (!Node.isCallExpression(expression)) {
      return undefined
    }

    const callee = expression.getExpression()

    if (!Node.isPropertyAccessExpression(callee) || callee.getExpression().getText() !== appVar) {
      return undefined
    }

    const argumentsList = expression.getArguments().map((argument) => this.parseExpression(argument))

    if (argumentsList.some((argument) => argument === undefined)) {
      return undefined
    }

    const parsedArguments = argumentsList.filter((argument) => this.isDefined(argument))

    return {
      method: callee.getName(),
      arguments: parsedArguments,
    }
  }

  private parseExpression(expression: Node): AstBootstrapExpression | undefined {
    const unwrappedExpression = this.unwrapExpression(expression)

    if (!unwrappedExpression) {
      return undefined
    }

    if (Node.isIdentifier(unwrappedExpression)) {
      return {
        kind: 'identifier',
        name: unwrappedExpression.getText(),
      }
    }

    if (Node.isStringLiteral(unwrappedExpression) || Node.isNoSubstitutionTemplateLiteral(unwrappedExpression)) {
      return {
        kind: 'string',
        value: unwrappedExpression.getLiteralValue(),
      }
    }

    if (Node.isNumericLiteral(unwrappedExpression)) {
      return {
        kind: 'number',
        value: Number(unwrappedExpression.getText()),
      }
    }

    if (
      Node.isPrefixUnaryExpression(unwrappedExpression) &&
      unwrappedExpression.getOperatorToken() === SyntaxKind.MinusToken
    ) {
      const operand = this.unwrapExpression(unwrappedExpression.getOperand())

      if (!operand || !Node.isNumericLiteral(operand)) {
        return undefined
      }

      return {
        kind: 'number',
        value: -Number(operand.getText()),
      }
    }

    if (unwrappedExpression.getKind() === SyntaxKind.TrueKeyword) {
      return {
        kind: 'boolean',
        value: true,
      }
    }

    if (unwrappedExpression.getKind() === SyntaxKind.FalseKeyword) {
      return {
        kind: 'boolean',
        value: false,
      }
    }

    if (unwrappedExpression.getKind() === SyntaxKind.NullKeyword) {
      return { kind: 'null' }
    }

    if (Node.isArrayLiteralExpression(unwrappedExpression)) {
      const items = unwrappedExpression.getElements().map((element) => this.parseExpression(element))

      if (items.some((item) => item === undefined)) {
        return undefined
      }

      const parsedItems = items.filter((item) => this.isDefined(item))

      return {
        kind: 'array',
        items: parsedItems,
      }
    }

    if (Node.isObjectLiteralExpression(unwrappedExpression)) {
      const properties = unwrappedExpression.getProperties().map((property) => {
        if (Node.isPropertyAssignment(property)) {
          const key = this.getObjectPropertyKey(property.getNameNode())
          const value = this.parseExpression(property.getInitializerOrThrow())

          if (!key || value === undefined) {
            return undefined
          }

          return { key, value }
        }

        if (Node.isShorthandPropertyAssignment(property)) {
          const key = property.getName()
          return {
            key,
            value: {
              kind: 'identifier',
              name: key,
            } satisfies Extract<AstBootstrapExpression, { kind: 'identifier' }>,
          }
        }

        return undefined
      })

      if (properties.some((property) => property === undefined)) {
        return undefined
      }

      const parsedProperties = properties.filter((property) => this.isDefined(property))

      return {
        kind: 'object',
        properties: parsedProperties,
      }
    }

    if (Node.isPropertyAccessExpression(unwrappedExpression)) {
      const objectText = unwrappedExpression.getExpression().getText()
      const property = unwrappedExpression.getName()

      if (!this.isLegalIdentifier(objectText) || !this.isLegalIdentifier(property)) {
        return undefined
      }

      return {
        kind: 'member',
        object: objectText,
        property,
      }
    }

    if (Node.isCallExpression(unwrappedExpression)) {
      const calleeExpression = this.parseCallCallee(unwrappedExpression.getExpression())
      const argumentsList = unwrappedExpression.getArguments().map((argument) => this.parseExpression(argument))

      if (!calleeExpression || argumentsList.some((argument) => argument === undefined)) {
        return undefined
      }

      const parsedArguments = argumentsList.filter((argument) => this.isDefined(argument))

      return {
        kind: 'call',
        callee: calleeExpression,
        arguments: parsedArguments,
      }
    }

    if (Node.isNewExpression(unwrappedExpression)) {
      const constructorExpression = this.parseCallCallee(unwrappedExpression.getExpression())
      const argumentsList = unwrappedExpression
        .getArguments()
        .map((argument) => this.parseExpression(argument))

      if (!constructorExpression || argumentsList.some((argument) => argument === undefined)) {
        return undefined
      }

      const parsedArguments = argumentsList.filter((argument) => this.isDefined(argument))

      return {
        kind: 'new',
        constructor: constructorExpression,
        arguments: parsedArguments,
      }
    }

    return undefined
  }

  private parseCallCallee(expression: Expression): Extract<
    AstBootstrapExpression,
    { kind: 'identifier' } | { kind: 'member' }
  > | undefined {
    const parsed = this.parseExpression(expression)

    if (!parsed || (parsed.kind !== 'identifier' && parsed.kind !== 'member')) {
      return undefined
    }

    return parsed
  }

  private getObjectPropertyKey(nameNode: Node): string | undefined {
    if (Node.isIdentifier(nameNode) || Node.isStringLiteral(nameNode) || Node.isNumericLiteral(nameNode)) {
      return Node.isIdentifier(nameNode) ? nameNode.getText() : nameNode.getLiteralText()
    }

    return undefined
  }

  private callsAreEquivalent(
    left: AstNestAddBootstrapCallOperation['call'],
    right: AstNestAddBootstrapCallOperation['call']
  ): boolean {
    return left.method === right.method && this.expressionsAreEquivalent(left.arguments, right.arguments)
  }

  private expressionsAreEquivalent(left: AstBootstrapExpression[], right: AstBootstrapExpression[]): boolean
  private expressionsAreEquivalent(left: AstBootstrapExpression, right: AstBootstrapExpression): boolean
  private expressionsAreEquivalent(
    left: AstBootstrapExpression[] | AstBootstrapExpression,
    right: AstBootstrapExpression[] | AstBootstrapExpression
  ): boolean {
    if (Array.isArray(left) || Array.isArray(right)) {
      if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
        return false
      }

      return left.every((item, index) => this.expressionsAreEquivalent(item, right[index]!))
    }

    if (left.kind !== right.kind) {
      return false
    }

    switch (left.kind) {
      case 'identifier': {
        const rightIdentifier = right as Extract<
          AstBootstrapExpression,
          { kind: 'identifier' }
        >
        return left.name === rightIdentifier.name
      }
      case 'string': {
        const rightString = right as Extract<AstBootstrapExpression, { kind: 'string' }>
        return left.value === rightString.value
      }
      case 'number': {
        const rightNumber = right as Extract<AstBootstrapExpression, { kind: 'number' }>
        return left.value === rightNumber.value
      }
      case 'boolean': {
        const rightBoolean = right as Extract<
          AstBootstrapExpression,
          { kind: 'boolean' }
        >
        return left.value === rightBoolean.value
      }
      case 'null':
        return true
      case 'array': {
        const rightArray = right as Extract<AstBootstrapExpression, { kind: 'array' }>
        return this.expressionsAreEquivalent(left.items, rightArray.items)
      }
      case 'object': {
        const rightObject = right as Extract<AstBootstrapExpression, { kind: 'object' }>
        return this.objectPropertiesAreEquivalent(
          left.properties,
          rightObject.properties
        )
      }
      case 'member': {
        const rightMember = right as Extract<AstBootstrapExpression, { kind: 'member' }>
        return (
          left.object === rightMember.object &&
          left.property === rightMember.property
        )
      }
      case 'call': {
        const rightCall = right as Extract<AstBootstrapExpression, { kind: 'call' }>
        return (
          this.expressionsAreEquivalent(left.callee, rightCall.callee) &&
          this.expressionsAreEquivalent(left.arguments, rightCall.arguments)
        )
      }
      case 'new': {
        const rightConstructorCall = right as Extract<AstBootstrapExpression, { kind: 'new' }>
        return (
          this.expressionsAreEquivalent(left.constructor, rightConstructorCall.constructor) &&
          this.expressionsAreEquivalent(left.arguments, rightConstructorCall.arguments)
        )
      }
    }
  }

  private renderCallStatement(appVar: string, call: AstNestAddBootstrapCallOperation['call']): string {
    return `${appVar}.${call.method}(${call.arguments.map((argument) => this.renderExpression(argument)).join(', ')})`
  }

  private renderExpression(expression: AstBootstrapExpression): string {
    switch (expression.kind) {
      case 'identifier':
        this.assertLegalIdentifier(
          expression.name,
          `Expected identifier "${expression.name}" to be a legal identifier.`
        )
        return expression.name
      case 'string':
        return this.renderStringLiteral(expression.value)
      case 'number':
        return String(expression.value)
      case 'boolean':
        return String(expression.value)
      case 'null':
        return 'null'
      case 'array':
        return `[${expression.items.map((item) => this.renderExpression(item)).join(', ')}]`
      case 'object':
        return `{ ${expression.properties
          .map((property) => `${this.renderObjectKey(property.key)}: ${this.renderExpression(property.value)}`)
          .join(', ')} }`
      case 'member':
        this.assertLegalIdentifier(
          expression.object,
          `Expected member object "${expression.object}" to be a legal identifier.`
        )
        this.assertLegalIdentifier(
          expression.property,
          `Expected member property "${expression.property}" to be a legal identifier.`
        )
        return `${expression.object}.${expression.property}`
      case 'call':
        return `${this.renderExpression(expression.callee)}(${expression.arguments
          .map((argument) => this.renderExpression(argument))
          .join(', ')})`
      case 'new':
        return `new ${this.renderExpression(expression.constructor)}(${expression.arguments
          .map((argument) => this.renderExpression(argument))
          .join(', ')})`
    }
  }

  private collectReferencedIdentifiers(expressions: AstBootstrapExpression[]): string[] {
    return expressions.flatMap((expression) => this.collectReferencedIdentifiersFromExpression(expression))
  }

  private collectReferencedIdentifiersFromExpression(expression: AstBootstrapExpression): string[] {
    switch (expression.kind) {
      case 'identifier':
        return [expression.name]
      case 'string':
      case 'number':
      case 'boolean':
      case 'null':
        return []
      case 'array':
        return this.collectReferencedIdentifiers(expression.items)
      case 'object':
        return expression.properties.flatMap((property) =>
          this.collectReferencedIdentifiersFromExpression(property.value)
        )
      case 'member':
        return [expression.object]
      case 'call':
        return [
          ...this.collectReferencedIdentifiersFromExpression(expression.callee),
          ...this.collectReferencedIdentifiers(expression.arguments),
        ]
      case 'new':
        return [
          ...this.collectReferencedIdentifiersFromExpression(expression.constructor),
          ...this.collectReferencedIdentifiers(expression.arguments),
        ]
    }
  }

  private getDeclaredNames(nameNode: Node): string[] {
    if (Node.isIdentifier(nameNode)) {
      return [nameNode.getText()]
    }

    return nameNode.getDescendantsOfKind(SyntaxKind.Identifier).map((identifier) => identifier.getText())
  }

  private getStatementDeclaredNames(statement: Node): string[] {
    if (Node.isVariableStatement(statement)) {
      return statement
        .getDeclarations()
        .flatMap((declaration) => this.getDeclaredNames(declaration.getNameNode()))
    }

    if (Node.isClassDeclaration(statement) || Node.isEnumDeclaration(statement)) {
      const name = statement.getName()
      return name ? [name] : []
    }

    return []
  }

  private renderObjectKey(key: string): string {
    return this.isLegalIdentifier(key) ? key : this.renderStringLiteral(key)
  }

  private renderStringLiteral(value: string): string {
    return `'${value
      .replace(/\\/g, '\\\\')
      .replace(/\r/g, '\\r')
      .replace(/\n/g, '\\n')
      .replace(/\t/g, '\\t')
      .replaceAll(String.fromCharCode(8), '\\b')
      .replace(/\f/g, '\\f')
      .replaceAll(String.fromCharCode(11), '\\v')
      .replace(/'/g, "\\'")}'`
  }

  private objectPropertiesAreEquivalent(
    left: Array<{ key: string; value: AstBootstrapExpression }>,
    right: Array<{ key: string; value: AstBootstrapExpression }>
  ): boolean {
    if (left.length !== right.length) {
      return false
    }

    const unmatchedRightIndexes = new Set(right.map((_, index) => index))

    for (const leftProperty of left) {
      const matchingRightIndex = right.findIndex((rightProperty, index) => {
        return (
          unmatchedRightIndexes.has(index) &&
          leftProperty.key === rightProperty.key &&
          this.expressionsAreEquivalent(leftProperty.value, rightProperty.value)
        )
      })

      if (matchingRightIndex === -1) {
        return false
      }

      unmatchedRightIndexes.delete(matchingRightIndex)
    }

    return unmatchedRightIndexes.size === 0
  }

  private assertLegalIdentifier(name: string, message: string): void {
    if (!this.isLegalIdentifier(name)) {
      throw new KnittoError(message, Errors.AST_BOOTSTRAP_INVALID_IDENTIFIER)
    }
  }

  private isLegalIdentifier(name: string): boolean {
    return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name)
  }

  private isDefined<T>(value: T | undefined): value is T {
    return value !== undefined
  }
}
