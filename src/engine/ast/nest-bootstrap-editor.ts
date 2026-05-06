import { Errors } from '@core/errors/errors'
import { KnittoError } from '@core/errors/knitto-error'
import type {
  AstBootstrapMethodReceiver,
  AstNestAddBootstrapCallOperation,
  AstNestAddBootstrapMethodCallOperation,
  AstNestAddBootstrapVariableOperation,
  AstBootstrapExpression,
} from '@core/generation/ast-operation'
import { Node, SyntaxKind, type Block, type CallExpression, type Expression, type SourceFile } from 'ts-morph'

type EnsureBootstrapCallInput = {
  sourceFile: SourceFile
  appVar: string
  call: AstNestAddBootstrapCallOperation['call']
}

type EnsureBootstrapVariableInput = {
  sourceFile: SourceFile
  declarationKind: AstNestAddBootstrapVariableOperation['declarationKind']
  name: string
  initializer: AstNestAddBootstrapVariableOperation['initializer']
}

type EnsureBootstrapMethodCallInput = {
  sourceFile: SourceFile
  receiver: AstNestAddBootstrapMethodCallOperation['receiver']
  method: string
  arguments: AstNestAddBootstrapMethodCallOperation['arguments']
}

export class NestBootstrapEditor {
  ensureBootstrapCall({ sourceFile, appVar, call }: EnsureBootstrapCallInput): void {
    const { bootstrapBody, appDeclaration } = this.getBootstrapAppContext(sourceFile, appVar)

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

  ensureBootstrapVariable({
    sourceFile,
    declarationKind,
    name,
    initializer,
  }: EnsureBootstrapVariableInput): void {
    const { bootstrapBody, appDeclaration } = this.getBootstrapAppContext(sourceFile)
    const appVar = appDeclaration.getName()

    this.assertLegalIdentifier(
      name,
      `Expected bootstrap variable name "${name}" to be a legal identifier.`
    )

    const existingDeclaration = this.findBootstrapVariableDeclaration(bootstrapBody, name)

    if (existingDeclaration) {
      const existingDeclarationKind = existingDeclaration.getVariableStatementOrThrow().getDeclarationKind()
      const existingInitializer = existingDeclaration.getInitializer()
      const parsedInitializer = existingInitializer
        ? this.parseExpression(existingInitializer)
        : undefined

      if (
        existingDeclarationKind === declarationKind &&
        parsedInitializer !== undefined &&
        this.expressionsAreEquivalent(parsedInitializer, initializer)
      ) {
        this.assertStatementAppearsBeforeListen(
          bootstrapBody,
          appVar,
          existingDeclaration.getVariableStatementOrThrow(),
          `Bootstrap variable "${name}"`
        )
        return
      }

      throw new KnittoError(
        `Bootstrap variable "${name}" already exists in bootstrap() with a different declaration.`,
        Errors.AST_BOOTSTRAP_VARIABLE_CONFLICT
      )
    }

    const appStatement = appDeclaration.getVariableStatementOrThrow()
    const statementIndex = this.getBootstrapVariableInsertionStatementIndex(
      bootstrapBody,
      appStatement,
      name,
      initializer,
      appVar
    )

    bootstrapBody.insertStatements(
      statementIndex + 1,
      this.renderVariableStatement(declarationKind, name, initializer)
    )
  }

  ensureBootstrapMethodCall({
    sourceFile,
    receiver,
    method,
    arguments: argumentsList,
  }: EnsureBootstrapMethodCallInput): void {
    const { bootstrapBody, appDeclaration } = this.getBootstrapAppContext(sourceFile)
    const appVar = appDeclaration.getName()

    this.assertLegalBootstrapMethodReceiver(receiver)
    this.assertLegalIdentifier(
      method,
      `Expected bootstrap method call method "${method}" to be a legal identifier.`
    )

    const expectedCall = {
      receiver,
      method,
      arguments: argumentsList,
    }

    const existingEquivalentMethodCall = this.findEquivalentMethodCallStatement(
      bootstrapBody,
      appVar,
      expectedCall
    )

    if (existingEquivalentMethodCall) {
      this.assertStatementAppearsBeforeListen(
        bootstrapBody,
        appVar,
        existingEquivalentMethodCall,
        `Bootstrap method call "${this.renderMethodCallDisplay(receiver, method)}"`
      )

      return
    }

    const appStatement = appDeclaration.getVariableStatementOrThrow()
    const statementIndex = this.getBootstrapMethodCallInsertionStatementIndex(
      bootstrapBody,
      appStatement,
      appVar,
      receiver,
      argumentsList,
      method
    )

    bootstrapBody.insertStatements(
      statementIndex + 1,
      this.renderMethodCallStatement(receiver, method, argumentsList)
    )
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

  private getBootstrapVariableInsertionStatementIndex(
    bootstrapBody: Block,
    appStatement: Node,
    variableName: string,
    initializer: AstBootstrapExpression,
    appVar: string
  ): number {
    const statements = bootstrapBody.getStatements()
    const appStatementIndex = statements.findIndex((statement) => statement === appStatement)
    const listenStatementIndex = this.getListenStatementIndex(bootstrapBody, appVar)
    const referencedNames = new Set(this.collectReferencedIdentifiers([initializer]))

    referencedNames.delete(appVar)

    if (
      listenStatementIndex !== -1 &&
      this.hasReferencedDeclarationAfterIndex(bootstrapBody, referencedNames, listenStatementIndex)
    ) {
      throw new KnittoError(
        `Bootstrap variable "${variableName}" depends on local declarations that appear after app.listen(...) in bootstrap().`,
        Errors.AST_BOOTSTRAP_DEPENDENCY_AFTER_LISTEN
      )
    }

    const latestRequiredDeclarationIndex = this.getLatestRequiredDeclarationIndex(
      bootstrapBody,
      appStatementIndex,
      appVar,
      [initializer],
      listenStatementIndex
    )

    return listenStatementIndex === -1
      ? latestRequiredDeclarationIndex
      : Math.min(latestRequiredDeclarationIndex, listenStatementIndex - 1)
  }

  private getBootstrapMethodCallInsertionStatementIndex(
    bootstrapBody: Block,
    appStatement: Node,
    appVar: string,
    receiver: AstBootstrapMethodReceiver,
    argumentsList: AstBootstrapExpression[],
    method: string
  ): number {
    const statements = bootstrapBody.getStatements()
    const appStatementIndex = statements.findIndex((statement) => statement === appStatement)
    const listenStatementIndex = this.getListenStatementIndex(bootstrapBody, appVar)
    const referencedNames = new Set(
      this.collectReceiverReferencedIdentifiers(receiver, argumentsList)
    )

    referencedNames.delete(appVar)

    if (
      listenStatementIndex !== -1 &&
      this.hasReferencedDeclarationAfterIndex(bootstrapBody, referencedNames, listenStatementIndex)
    ) {
      throw new KnittoError(
        `Bootstrap method call "${this.renderMethodCallDisplay(receiver, method)}" depends on local declarations that appear after app.listen(...) in bootstrap().`,
        Errors.AST_BOOTSTRAP_DEPENDENCY_AFTER_LISTEN
      )
    }

    const latestRequiredDeclarationIndex = this.getLatestRequiredDeclarationIndexFromNames(
      bootstrapBody,
      appStatementIndex,
      referencedNames,
      listenStatementIndex === -1 ? Number.POSITIVE_INFINITY : listenStatementIndex - 1
    )

    let insertionIndex = latestRequiredDeclarationIndex

    for (let index = insertionIndex + 1; index < statements.length; index += 1) {
      if (listenStatementIndex !== -1 && index >= listenStatementIndex) {
        break
      }

      const statement = statements[index]

      if (!statement || !Node.isExpressionStatement(statement)) {
        break
      }

      if (!this.parseBootstrapMethodCall(statement.getExpression())) {
        break
      }

      insertionIndex = index
    }

    return insertionIndex
  }

  private hasReferencedDeclarationAfterIndex(
    bootstrapBody: Block,
    referencedNames: Set<string>,
    statementIndex: number
  ): boolean {
    if (referencedNames.size === 0) {
      return false
    }

    const statements = bootstrapBody.getStatements()

    for (let index = statementIndex + 1; index < statements.length; index += 1) {
      const statement = statements[index]

      if (!statement) {
        continue
      }

      const declaredNames = this.getStatementDeclaredNames(statement)

      if (declaredNames.some((name) => referencedNames.has(name))) {
        return true
      }
    }

    return false
  }

  private getLatestRequiredDeclarationIndex(
    bootstrapBody: Block,
    appStatementIndex: number,
    appVar: string,
    argumentsList: AstBootstrapExpression[],
    maxStatementIndex = Number.POSITIVE_INFINITY
  ): number {
    const referencedNames = new Set(this.collectReferencedIdentifiers(argumentsList))

    referencedNames.delete(appVar)

    return this.getLatestRequiredDeclarationIndexFromNames(
      bootstrapBody,
      appStatementIndex,
      referencedNames,
      maxStatementIndex
    )
  }

  private getLatestRequiredDeclarationIndexFromNames(
    bootstrapBody: Block,
    appStatementIndex: number,
    referencedNames: Set<string>,
    maxStatementIndex = Number.POSITIVE_INFINITY
  ): number {

    if (referencedNames.size === 0) {
      return appStatementIndex
    }

    const statements = bootstrapBody.getStatements()
    let latestIndex = appStatementIndex

    for (
      let index = appStatementIndex + 1;
      index < statements.length && index <= maxStatementIndex;
      index += 1
    ) {
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

  private getListenStatementIndex(bootstrapBody: Block, appVar: string): number {
    return bootstrapBody.getStatements().findIndex((statement) => {
      if (!Node.isExpressionStatement(statement)) {
        return false
      }

      const expression = this.unwrapExpression(statement.getExpression())

      if (!expression || !Node.isCallExpression(expression)) {
        return false
      }

      const callee = expression.getExpression()

      return (
        Node.isPropertyAccessExpression(callee) &&
        callee.getExpression().getText() === appVar &&
        callee.getName() === 'listen'
      )
    })
  }

  private getBootstrapAppContext(sourceFile: SourceFile, appVar?: string) {
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

    const appDeclaration = appVar
      ? this.findBootstrapAppDeclarationByName(bootstrapBody, appVar)
      : this.findBootstrapAppDeclaration(bootstrapBody)

    if (!appDeclaration) {
      throw new KnittoError(
        appVar
          ? `Could not find ${appVar} variable declaration in bootstrap() scope.`
          : 'Could not find a NestFactory.create(...) application variable declaration in bootstrap().',
        Errors.AST_BOOTSTRAP_APP_VAR_NOT_FOUND
      )
    }

    const createCall = this.getNestFactoryCreateCall(appDeclaration.getInitializer())

    if (!createCall) {
      throw new KnittoError(
        `Expected ${appDeclaration.getName()} to be initialized by NestFactory.create(...) in bootstrap().`,
        Errors.AST_BOOTSTRAP_APP_VAR_NOT_NEST_FACTORY_CREATE
      )
    }

    return { bootstrapBody, appDeclaration }
  }

  private findBootstrapAppDeclarationByName(bootstrapBody: Block, appVar: string) {
    return bootstrapBody
      .getDescendantsOfKind(SyntaxKind.VariableDeclaration)
      .find((declaration) => {
        return (
          declaration.getName() === appVar &&
          declaration.getFirstAncestorByKind(SyntaxKind.Block) === bootstrapBody
        )
      })
  }

  private findBootstrapAppDeclaration(bootstrapBody: Block) {
    return bootstrapBody
      .getDescendantsOfKind(SyntaxKind.VariableDeclaration)
      .find((declaration) => {
        return (
          declaration.getFirstAncestorByKind(SyntaxKind.Block) === bootstrapBody &&
          this.getNestFactoryCreateCall(declaration.getInitializer()) !== undefined
        )
      })
  }

  private findBootstrapVariableDeclaration(bootstrapBody: Block, name: string) {
    return bootstrapBody
      .getDescendantsOfKind(SyntaxKind.VariableDeclaration)
      .find((declaration) => {
        return (
          declaration.getName() === name &&
          declaration.getFirstAncestorByKind(SyntaxKind.Block) === bootstrapBody
        )
      })
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

  private findEquivalentMethodCallStatement(
    bootstrapBody: Block,
    appVar: string,
    expectedCall: Pick<AstNestAddBootstrapMethodCallOperation, 'receiver' | 'method' | 'arguments'>
  ): Node | undefined {
    return bootstrapBody.getStatements().find((statement) => {
      if (!Node.isExpressionStatement(statement)) {
        return false
      }

      const existingCall = this.parseBootstrapMethodCall(statement.getExpression())

      return existingCall !== undefined && this.methodCallsAreEquivalent(existingCall, expectedCall)
    })
  }

  private assertStatementAppearsBeforeListen(
    bootstrapBody: Block,
    appVar: string,
    statement: Node,
    label: string
  ): void {
    const listenStatementIndex = this.getListenStatementIndex(bootstrapBody, appVar)

    if (listenStatementIndex === -1) {
      return
    }

    const statementIndex = bootstrapBody
      .getStatements()
      .findIndex((existingStatement) => existingStatement === statement)

    if (statementIndex > listenStatementIndex) {
      throw new KnittoError(
        `${label} already exists after app.listen(...) in bootstrap().`,
        Errors.AST_BOOTSTRAP_DEPENDENCY_AFTER_LISTEN
      )
    }
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

  private parseBootstrapMethodCall(
    expression: Expression
  ): Pick<AstNestAddBootstrapMethodCallOperation, 'receiver' | 'method' | 'arguments'> | undefined {
    if (!Node.isCallExpression(expression)) {
      return undefined
    }

    const callee = expression.getExpression()

    if (!Node.isPropertyAccessExpression(callee)) {
      return undefined
    }

    const receiver = this.parseCallCallee(callee.getExpression())

    if (!receiver) {
      return undefined
    }

    const argumentsList = expression.getArguments().map((argument) => this.parseExpression(argument))

    if (argumentsList.some((argument) => argument === undefined)) {
      return undefined
    }

    const parsedArguments = argumentsList.filter((argument) => this.isDefined(argument))

    return {
      receiver,
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

  private methodCallsAreEquivalent(
    left: Pick<AstNestAddBootstrapMethodCallOperation, 'receiver' | 'method' | 'arguments'>,
    right: Pick<AstNestAddBootstrapMethodCallOperation, 'receiver' | 'method' | 'arguments'>
  ): boolean {
    return (
      left.method === right.method &&
      this.expressionsAreEquivalent(left.receiver, right.receiver) &&
      this.expressionsAreEquivalent(left.arguments, right.arguments)
    )
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

  private renderVariableStatement(
    declarationKind: AstNestAddBootstrapVariableOperation['declarationKind'],
    name: string,
    initializer: AstBootstrapExpression
  ): string {
    return `${declarationKind} ${name} = ${this.renderExpression(initializer)}`
  }

  private renderMethodCallStatement(
    receiver: AstBootstrapMethodReceiver,
    method: string,
    argumentsList: AstBootstrapExpression[]
  ): string {
    return `${this.renderExpression(receiver)}.${method}(${argumentsList
      .map((argument) => this.renderExpression(argument))
      .join(', ')})`
  }

  private renderMethodCallDisplay(receiver: AstBootstrapMethodReceiver, method: string): string {
    return `${this.renderExpression(receiver)}.${method}(...)`
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

  private collectReceiverReferencedIdentifiers(
    receiver: AstBootstrapMethodReceiver,
    argumentsList: AstBootstrapExpression[]
  ): string[] {
    return [
      ...this.collectReferencedIdentifiersFromExpression(receiver),
      ...this.collectReferencedIdentifiers(argumentsList),
    ]
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

  private assertLegalBootstrapMethodReceiver(receiver: AstBootstrapMethodReceiver): void {
    if (receiver.kind === 'identifier') {
      this.assertLegalIdentifier(
        receiver.name,
        `Expected bootstrap method call receiver identifier "${receiver.name}" to be a legal identifier.`
      )
      return
    }

    this.assertLegalIdentifier(
      receiver.object,
      `Expected bootstrap method call receiver object "${receiver.object}" to be a legal identifier.`
    )
    this.assertLegalIdentifier(
      receiver.property,
      `Expected bootstrap method call receiver property "${receiver.property}" to be a legal identifier.`
    )
  }

  private isDefined<T>(value: T | undefined): value is T {
    return value !== undefined
  }
}
