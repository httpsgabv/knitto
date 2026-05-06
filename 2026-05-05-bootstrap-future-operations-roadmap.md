# Bootstrap Future Operations Roadmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the bootstrap manifest system with the next four high-leverage capabilities: standalone function calls, await support, default imports, and side-effect imports.

**Architecture:** Keep the current bootstrap system narrow and semantic instead of introducing a generic arbitrary-statement DSL. Add each capability as its own small operation or targeted extension, reuse the existing `AstBootstrapExpression` model where possible, and keep insertion, idempotency, and dependency rules centralized in `NestBootstrapEditor` and the existing AST import editors.

**Tech Stack:** TypeScript, Zod, ts-morph, Vitest

---

## Scope And Session Strategy

This roadmap intentionally covers multiple independent additions. Future agent sessions should usually implement **one task per session**, in order.

- Task 1: `ast.nest.add-bootstrap-function-call`
- Task 2: await support for bootstrap calls
- Task 3: `ast.add-default-import`
- Task 4: `ast.add-side-effect-import`

If a future session needs tighter focus, split one task from this roadmap into its own dedicated plan before implementation.

## File Structure

- Modify: `src/core/manifest/manifest-operation.schema.ts`
  Add new manifest schemas and any small shared schema helpers.
- Modify: `src/core/manifest/manifest-operation.ts`
  Export inferred manifest operation types.
- Modify: `src/core/generation/ast-operation.ts`
  Add generation operation types and any shared call receiver/callee types.
- Modify: `src/engine/plan/handlers/create-manifest-operation-handlers.ts`
  Register each new planning handler.
- Modify: `src/engine/plan/handlers/manifest-operation-handlers.test.ts`
  Cover handler output and registry entries.
- Modify: `src/engine/plan/manifest-operation-builder.test.ts`
  Verify builder output shapes and target resolution.
- Modify: `src/core/manifest/manifest.schema.test.ts`
  Cover valid and invalid manifest parsing.
- Modify: `src/engine/plan/manifest-operation-handler-registry.test.ts`
  Keep the full handler-record fixture type-complete as operation coverage grows.
- Modify: `src/engine/ast/nest-bootstrap-editor.ts`
  Add standalone bootstrap function-call support and await-aware rendering/duplicate detection.
- Modify: `src/engine/ast/nest-bootstrap-editor.test.ts`
  Cover insertion, idempotency, ordering, and await-specific behavior.
- Modify: `src/engine/ast/import-editor.ts`
  Extend import support for default and side-effect imports if the current editor is the right abstraction.
- Modify: `src/engine/ast/import-editor.test.ts`
  Cover new import variants.
- Modify: `src/engine/compose/handlers/create-handlers.ts`
  Register compose handlers for the new operations.
- Modify: `src/engine/compose/handlers/create-handlers.test.ts`
  Cover the registry entries.
- Create: `src/engine/plan/handlers/ast-nest-add-bootstrap-function-call-manifest-operation.handler.ts`
  Map standalone function-call manifest operations into generation operations.
- Create: `src/engine/compose/handlers/ast-nest-add-bootstrap-function-call.handler.ts`
  Execute standalone bootstrap function calls.
- Create: `src/engine/compose/handlers/ast-nest-add-bootstrap-function-call.handler.test.ts`
  Verify end-to-end compose execution.
- Create: `src/engine/plan/handlers/ast-add-default-import-manifest-operation.handler.ts`
  Map default-import manifest operations.
- Create: `src/engine/compose/handlers/ast-add-default-import.handler.ts`
  Execute default imports.
- Create: `src/engine/compose/handlers/ast-add-default-import.handler.test.ts`
  Verify default-import execution.
- Create: `src/engine/plan/handlers/ast-add-side-effect-import-manifest-operation.handler.ts`
  Map side-effect-import manifest operations.
- Create: `src/engine/compose/handlers/ast-add-side-effect-import.handler.ts`
  Execute side-effect imports.
- Create: `src/engine/compose/handlers/ast-add-side-effect-import.handler.test.ts`
  Verify side-effect-import execution.
- Modify: `operations.md`
  Add examples once each roadmap task lands.

## Roadmap Principles

- Prefer one semantic operation per use case over a generic statement wrapper.
- Keep `AstBootstrapExpression` as the main expression DSL.
- Reuse current identifier validation patterns.
- Treat duplicate detection as valid only when the existing statement is both semantically equivalent and legally placed before `await app.listen(...)`.
- Add examples to `operations.md` as part of each completed task so future users can discover the new surface area.

### Task 1: Add `ast.nest.add-bootstrap-function-call`

**Files:**
- Modify: `src/core/manifest/manifest-operation.schema.ts`
- Modify: `src/core/manifest/manifest-operation.ts`
- Modify: `src/core/generation/ast-operation.ts`
- Create: `src/engine/plan/handlers/ast-nest-add-bootstrap-function-call-manifest-operation.handler.ts`
- Modify: `src/engine/plan/handlers/create-manifest-operation-handlers.ts`
- Modify: `src/engine/plan/handlers/manifest-operation-handlers.test.ts`
- Modify: `src/engine/plan/manifest-operation-builder.test.ts`
- Modify: `src/core/manifest/manifest.schema.test.ts`
- Modify: `src/engine/plan/manifest-operation-handler-registry.test.ts`
- Modify: `src/engine/ast/nest-bootstrap-editor.ts`
- Modify: `src/engine/ast/nest-bootstrap-editor.test.ts`
- Create: `src/engine/compose/handlers/ast-nest-add-bootstrap-function-call.handler.ts`
- Create: `src/engine/compose/handlers/ast-nest-add-bootstrap-function-call.handler.test.ts`
- Modify: `src/engine/compose/handlers/create-handlers.ts`
- Modify: `src/engine/compose/handlers/create-handlers.test.ts`
- Modify: `operations.md`

- [ ] **Step 1: Write the failing manifest schema tests**

```ts
// src/core/manifest/manifest.schema.test.ts
it('parses ast.nest.add-bootstrap-function-call operations', () => {
  expect(
    ManifestOperationSchema.parse({
      type: 'ast.nest.add-bootstrap-function-call',
      target: 'src/main.ts',
      callee: { kind: 'identifier', name: 'setupSwagger' },
      arguments: [{ kind: 'identifier', name: 'app' }],
    })
  ).toEqual({
    type: 'ast.nest.add-bootstrap-function-call',
    target: 'src/main.ts',
    callee: { kind: 'identifier', name: 'setupSwagger' },
    arguments: [{ kind: 'identifier', name: 'app' }],
  })
})

it('rejects invalid bootstrap function names', () => {
  const result = ManifestOperationSchema.safeParse({
    type: 'ast.nest.add-bootstrap-function-call',
    target: 'src/main.ts',
    callee: { kind: 'identifier', name: 'setup-swagger' },
    arguments: [],
  })

  expect(result.success).toBe(false)
})
```

- [ ] **Step 2: Write the failing planning tests**

```ts
// src/engine/plan/manifest-operation-builder.test.ts
it('builds ast.nest.add-bootstrap-function-call operations', () => {
  const operation = builder.build({
    operation: {
      type: 'ast.nest.add-bootstrap-function-call',
      target: 'src/main.ts',
      callee: { kind: 'identifier', name: 'setupSwagger' },
      arguments: [{ kind: 'identifier', name: 'app' }],
    },
    templateDir,
    targetDir,
    origin,
  })

  expect(operation).toEqual({
    id: expect.stringMatching(/^ast-nest-add-bootstrap-function-call-\d+$/),
    type: 'ast.nest.add-bootstrap-function-call',
    target: '/projects/demo/src/main.ts',
    callee: { kind: 'identifier', name: 'setupSwagger' },
    arguments: [{ kind: 'identifier', name: 'app' }],
    origin,
    description: 'Apply ast.nest.add-bootstrap-function-call from auth',
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run:

```bash
pnpm vitest run src/core/manifest/manifest.schema.test.ts src/engine/plan/manifest-operation-builder.test.ts src/engine/plan/handlers/manifest-operation-handlers.test.ts src/engine/plan/manifest-operation-handler-registry.test.ts
```

Expected: FAIL because the new function-call operation is not yet part of the schema, types, or registries.

- [ ] **Step 4: Implement the schema, types, and planning handler minimally**

```ts
// src/core/generation/ast-operation.ts
export type AstBootstrapStandaloneCallee =
  | { kind: 'identifier'; name: string }
  | { kind: 'member'; object: string; property: string }

export type AstNestAddBootstrapFunctionCallOperation = BaseOperation & {
  type: 'ast.nest.add-bootstrap-function-call'
  target: string
  callee: AstBootstrapStandaloneCallee
  arguments: AstBootstrapExpression[]
}
```

```ts
// src/core/manifest/manifest-operation.schema.ts
const AstBootstrapStandaloneCalleeSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('identifier'), name: IdentifierSchema }),
  z.object({ kind: z.literal('member'), object: IdentifierSchema, property: IdentifierSchema }),
])

export const AstNestAddBootstrapFunctionCallManifestOperationSchema = z.object({
  type: z.literal('ast.nest.add-bootstrap-function-call'),
  target: z.string().min(1),
  callee: AstBootstrapStandaloneCalleeSchema,
  arguments: z.array(AstBootstrapExpressionSchema),
})
```

- [ ] **Step 5: Add editor and compose execution support**

Required behavior:

```ts
// src/engine/ast/nest-bootstrap-editor.ts
ensureBootstrapFunctionCall({
  sourceFile,
  callee,
  arguments,
}: {
  sourceFile: SourceFile
  callee: AstBootstrapStandaloneCallee
  arguments: AstBootstrapExpression[]
}): void
```

Rules:

```ts
// 1. insert after app creation by default
// 2. honor dependencies from callee + arguments
// 3. reject dependencies only available after listen
// 4. idempotent for equivalent, correctly placed function calls
// 5. support `setupSwagger(app)` and `bootstrapHelpers.setupSwagger(app)`
```

- [ ] **Step 6: Write and run targeted editor/compose tests**

Run:

```bash
pnpm vitest run src/engine/ast/nest-bootstrap-editor.test.ts src/engine/compose/handlers/ast-nest-add-bootstrap-function-call.handler.test.ts src/engine/compose/handlers/create-handlers.test.ts
```

Expected: PASS with regression coverage for insertion, idempotency, argument rendering, and dependency-after-listen failures.

- [ ] **Step 7: Update examples and run focused verification**

Add `operations.md` examples for:

```ts
setupSwagger(app)
bootstrapHelpers.setupSwagger(app)
registerTelemetry(app, config)
```

Run:

```bash
pnpm vitest run src/core/manifest/manifest.schema.test.ts src/engine/plan/manifest-operation-builder.test.ts src/engine/plan/handlers/manifest-operation-handlers.test.ts src/engine/plan/manifest-operation-handler-registry.test.ts src/engine/ast/nest-bootstrap-editor.test.ts src/engine/compose/handlers/ast-nest-add-bootstrap-function-call.handler.test.ts src/engine/compose/handlers/create-handlers.test.ts
pnpm typecheck
```

Expected: all listed tests pass and `tsc --noEmit -p tsconfig.json` exits cleanly.

- [ ] **Step 8: Commit the change**

```bash
git add src/core/manifest/manifest-operation.schema.ts src/core/manifest/manifest-operation.ts src/core/generation/ast-operation.ts src/engine/plan/handlers/ast-nest-add-bootstrap-function-call-manifest-operation.handler.ts src/engine/plan/handlers/create-manifest-operation-handlers.ts src/engine/plan/handlers/manifest-operation-handlers.test.ts src/engine/plan/manifest-operation-builder.test.ts src/core/manifest/manifest.schema.test.ts src/engine/plan/manifest-operation-handler-registry.test.ts src/engine/ast/nest-bootstrap-editor.ts src/engine/ast/nest-bootstrap-editor.test.ts src/engine/compose/handlers/ast-nest-add-bootstrap-function-call.handler.ts src/engine/compose/handlers/ast-nest-add-bootstrap-function-call.handler.test.ts src/engine/compose/handlers/create-handlers.ts src/engine/compose/handlers/create-handlers.test.ts operations.md
git commit -m "feat: add bootstrap function call operation"
```

### Task 2: Add Await Support To Bootstrap Call Operations

**Files:**
- Modify: `src/core/manifest/manifest-operation.schema.ts`
- Modify: `src/core/manifest/manifest-operation.ts`
- Modify: `src/core/generation/ast-operation.ts`
- Modify: `src/engine/plan/handlers/ast-nest-add-bootstrap-call-manifest-operation.handler.ts`
- Modify: `src/engine/plan/handlers/ast-nest-add-bootstrap-method-call-manifest-operation.handler.ts`
- Modify: `src/engine/plan/handlers/ast-nest-add-bootstrap-function-call-manifest-operation.handler.ts`
- Modify: `src/engine/plan/handlers/manifest-operation-handlers.test.ts`
- Modify: `src/engine/plan/manifest-operation-builder.test.ts`
- Modify: `src/core/manifest/manifest.schema.test.ts`
- Modify: `src/engine/ast/nest-bootstrap-editor.ts`
- Modify: `src/engine/ast/nest-bootstrap-editor.test.ts`
- Modify: `src/engine/compose/handlers/ast-nest-add-bootstrap-call.handler.ts`
- Modify: `src/engine/compose/handlers/ast-nest-add-bootstrap-method-call.handler.ts`
- Modify: `src/engine/compose/handlers/ast-nest-add-bootstrap-function-call.handler.ts`
- Modify: `src/engine/compose/handlers/ast-nest-add-bootstrap-method-call.handler.test.ts`
- Modify: `src/engine/compose/handlers/ast-nest-add-bootstrap-function-call.handler.test.ts`
- Modify: `operations.md`

- [ ] **Step 1: Write failing schema tests for optional `await: true`**

Recommended direction: do not add a generic `await` expression kind yet. Add an `await?: boolean` flag to the three bootstrap statement operations.

```ts
// src/core/manifest/manifest.schema.test.ts
it('parses awaited bootstrap method-call operations', () => {
  expect(
    ManifestOperationSchema.parse({
      type: 'ast.nest.add-bootstrap-method-call',
      target: 'src/main.ts',
      receiver: { kind: 'identifier', name: 'app' },
      method: 'init',
      arguments: [],
      await: true,
    })
  ).toMatchObject({
    type: 'ast.nest.add-bootstrap-method-call',
    await: true,
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
pnpm vitest run src/core/manifest/manifest.schema.test.ts src/engine/plan/manifest-operation-builder.test.ts src/engine/plan/handlers/manifest-operation-handlers.test.ts
```

Expected: FAIL because the existing statement operations do not yet accept `await`.

- [ ] **Step 3: Implement await support in manifest and generation types**

Required shape change:

```ts
type AstNestAddBootstrapCallOperation = BaseOperation & {
  type: 'ast.nest.add-bootstrap-call'
  target: string
  appVar: string
  await?: boolean
  call: {
    method: string
    arguments: AstBootstrapExpression[]
  }
}
```

Apply the same `await?: boolean` field to `ast.nest.add-bootstrap-method-call` and `ast.nest.add-bootstrap-function-call` in both manifest and generation types.

- [ ] **Step 4: Update editor rendering and duplicate detection**

Rules:

```ts
// awaited and non-awaited statements are NOT equivalent
await app.init()
app.init()
```

The editor must render:

```ts
await setupSwagger(app)
await services.logger.flush()
await app.init()
```

and preserve the current placement rules before `await app.listen(...)`.

- [ ] **Step 5: Add and run targeted editor and compose tests**

Run:

```bash
pnpm vitest run src/engine/ast/nest-bootstrap-editor.test.ts src/engine/compose/handlers/ast-nest-add-bootstrap-method-call.handler.test.ts src/engine/compose/handlers/ast-nest-add-bootstrap-function-call.handler.test.ts
```

Expected: PASS with awaited statement coverage for all three statement operations.

- [ ] **Step 6: Update examples and run focused verification**

Add `operations.md` examples for:

```ts
await setupSwagger(app)
await app.init()
await services.logger.flush()
```

Run:

```bash
pnpm vitest run src/core/manifest/manifest.schema.test.ts src/engine/plan/manifest-operation-builder.test.ts src/engine/plan/handlers/manifest-operation-handlers.test.ts src/engine/ast/nest-bootstrap-editor.test.ts src/engine/compose/handlers/ast-nest-add-bootstrap-method-call.handler.test.ts src/engine/compose/handlers/ast-nest-add-bootstrap-function-call.handler.test.ts
pnpm typecheck
```

Expected: all listed tests pass and `tsc --noEmit -p tsconfig.json` exits cleanly.

- [ ] **Step 7: Commit the change**

```bash
git add src/core/manifest/manifest-operation.schema.ts src/core/manifest/manifest-operation.ts src/core/generation/ast-operation.ts src/engine/plan/handlers/ast-nest-add-bootstrap-call-manifest-operation.handler.ts src/engine/plan/handlers/ast-nest-add-bootstrap-method-call-manifest-operation.handler.ts src/engine/plan/handlers/ast-nest-add-bootstrap-function-call-manifest-operation.handler.ts src/engine/plan/handlers/manifest-operation-handlers.test.ts src/engine/plan/manifest-operation-builder.test.ts src/core/manifest/manifest.schema.test.ts src/engine/ast/nest-bootstrap-editor.ts src/engine/ast/nest-bootstrap-editor.test.ts src/engine/compose/handlers/ast-nest-add-bootstrap-call.handler.ts src/engine/compose/handlers/ast-nest-add-bootstrap-method-call.handler.ts src/engine/compose/handlers/ast-nest-add-bootstrap-function-call.handler.ts src/engine/compose/handlers/ast-nest-add-bootstrap-method-call.handler.test.ts src/engine/compose/handlers/ast-nest-add-bootstrap-function-call.handler.test.ts operations.md
git commit -m "feat: add await support to bootstrap statements"
```

### Task 3: Add `ast.add-default-import`

**Files:**
- Modify: `src/core/manifest/manifest-operation.schema.ts`
- Modify: `src/core/manifest/manifest-operation.ts`
- Modify: `src/core/generation/ast-operation.ts`
- Create: `src/engine/plan/handlers/ast-add-default-import-manifest-operation.handler.ts`
- Modify: `src/engine/plan/handlers/create-manifest-operation-handlers.ts`
- Modify: `src/engine/plan/handlers/manifest-operation-handlers.test.ts`
- Modify: `src/engine/plan/manifest-operation-builder.test.ts`
- Modify: `src/core/manifest/manifest.schema.test.ts`
- Modify: `src/engine/plan/manifest-operation-handler-registry.test.ts`
- Modify: `src/engine/ast/import-editor.ts`
- Modify: `src/engine/ast/import-editor.test.ts`
- Create: `src/engine/compose/handlers/ast-add-default-import.handler.ts`
- Create: `src/engine/compose/handlers/ast-add-default-import.handler.test.ts`
- Modify: `src/engine/compose/handlers/create-handlers.ts`
- Modify: `src/engine/compose/handlers/create-handlers.test.ts`
- Modify: `operations.md`

- [ ] **Step 1: Write the failing schema and planning tests**

```ts
// src/core/manifest/manifest.schema.test.ts
it('parses ast.add-default-import operations', () => {
  expect(
    ManifestOperationSchema.parse({
      type: 'ast.add-default-import',
      target: 'src/main.ts',
      default: 'helmet',
      from: 'helmet',
    })
  ).toEqual({
    type: 'ast.add-default-import',
    target: 'src/main.ts',
    default: 'helmet',
    from: 'helmet',
  })
})
```

```ts
// src/engine/plan/manifest-operation-builder.test.ts
it('builds ast.add-default-import operations', () => {
  const operation = builder.build({
    operation: {
      type: 'ast.add-default-import',
      target: 'src/main.ts',
      default: 'helmet',
      from: 'helmet',
    },
    templateDir,
    targetDir,
    origin,
  })

  expect(operation).toMatchObject({
    type: 'ast.add-default-import',
    target: '/projects/demo/src/main.ts',
    default: 'helmet',
    from: 'helmet',
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
pnpm vitest run src/core/manifest/manifest.schema.test.ts src/engine/plan/manifest-operation-builder.test.ts src/engine/plan/handlers/manifest-operation-handlers.test.ts src/engine/ast/import-editor.test.ts
```

Expected: FAIL because default imports are not yet part of the schema or import editor.

- [ ] **Step 3: Implement schema, types, and import-editor support**

Required surface:

```ts
export type AstAddDefaultImportOperation = BaseOperation & {
  type: 'ast.add-default-import'
  target: string
  default: string
  from: string
}
```

Import-editor behavior:

```ts
import helmet from 'helmet'
```

must be idempotent and must not duplicate an equivalent default import.

- [ ] **Step 4: Add compose handler support and tests**

Run:

```bash
pnpm vitest run src/engine/ast/import-editor.test.ts src/engine/compose/handlers/ast-add-default-import.handler.test.ts src/engine/compose/handlers/create-handlers.test.ts
```

Expected: PASS.

- [ ] **Step 5: Update examples and run focused verification**

Add `operations.md` examples for:

```ts
import helmet from 'helmet'
import compression from 'compression'
```

Run:

```bash
pnpm vitest run src/core/manifest/manifest.schema.test.ts src/engine/plan/manifest-operation-builder.test.ts src/engine/plan/handlers/manifest-operation-handlers.test.ts src/engine/plan/manifest-operation-handler-registry.test.ts src/engine/ast/import-editor.test.ts src/engine/compose/handlers/ast-add-default-import.handler.test.ts src/engine/compose/handlers/create-handlers.test.ts
pnpm typecheck
```

Expected: all listed tests pass and `tsc --noEmit -p tsconfig.json` exits cleanly.

- [ ] **Step 6: Commit the change**

```bash
git add src/core/manifest/manifest-operation.schema.ts src/core/manifest/manifest-operation.ts src/core/generation/ast-operation.ts src/engine/plan/handlers/ast-add-default-import-manifest-operation.handler.ts src/engine/plan/handlers/create-manifest-operation-handlers.ts src/engine/plan/handlers/manifest-operation-handlers.test.ts src/engine/plan/manifest-operation-builder.test.ts src/core/manifest/manifest.schema.test.ts src/engine/plan/manifest-operation-handler-registry.test.ts src/engine/ast/import-editor.ts src/engine/ast/import-editor.test.ts src/engine/compose/handlers/ast-add-default-import.handler.ts src/engine/compose/handlers/ast-add-default-import.handler.test.ts src/engine/compose/handlers/create-handlers.ts src/engine/compose/handlers/create-handlers.test.ts operations.md
git commit -m "feat: add default import operation"
```

### Task 4: Add `ast.add-side-effect-import`

**Files:**
- Modify: `src/core/manifest/manifest-operation.schema.ts`
- Modify: `src/core/manifest/manifest-operation.ts`
- Modify: `src/core/generation/ast-operation.ts`
- Create: `src/engine/plan/handlers/ast-add-side-effect-import-manifest-operation.handler.ts`
- Modify: `src/engine/plan/handlers/create-manifest-operation-handlers.ts`
- Modify: `src/engine/plan/handlers/manifest-operation-handlers.test.ts`
- Modify: `src/engine/plan/manifest-operation-builder.test.ts`
- Modify: `src/core/manifest/manifest.schema.test.ts`
- Modify: `src/engine/plan/manifest-operation-handler-registry.test.ts`
- Modify: `src/engine/ast/import-editor.ts`
- Modify: `src/engine/ast/import-editor.test.ts`
- Create: `src/engine/compose/handlers/ast-add-side-effect-import.handler.ts`
- Create: `src/engine/compose/handlers/ast-add-side-effect-import.handler.test.ts`
- Modify: `src/engine/compose/handlers/create-handlers.ts`
- Modify: `src/engine/compose/handlers/create-handlers.test.ts`
- Modify: `operations.md`

- [ ] **Step 1: Write the failing schema and import-editor tests**

```ts
// src/core/manifest/manifest.schema.test.ts
it('parses ast.add-side-effect-import operations', () => {
  expect(
    ManifestOperationSchema.parse({
      type: 'ast.add-side-effect-import',
      target: 'src/main.ts',
      from: 'dotenv/config',
    })
  ).toEqual({
    type: 'ast.add-side-effect-import',
    target: 'src/main.ts',
    from: 'dotenv/config',
  })
})
```

```ts
// src/engine/ast/import-editor.test.ts
it('adds side-effect imports idempotently', async () => {
  // expect: import 'dotenv/config'
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
pnpm vitest run src/core/manifest/manifest.schema.test.ts src/engine/plan/manifest-operation-builder.test.ts src/engine/plan/handlers/manifest-operation-handlers.test.ts src/engine/ast/import-editor.test.ts
```

Expected: FAIL because side-effect imports are not yet supported.

- [ ] **Step 3: Implement schema, types, and import-editor support**

Required surface:

```ts
export type AstAddSideEffectImportOperation = BaseOperation & {
  type: 'ast.add-side-effect-import'
  target: string
  from: string
}
```

Import-editor behavior:

```ts
import 'dotenv/config'
import 'reflect-metadata'
```

must be idempotent and must not duplicate an equivalent side-effect import.

- [ ] **Step 4: Add compose handler support and tests**

Run:

```bash
pnpm vitest run src/engine/ast/import-editor.test.ts src/engine/compose/handlers/ast-add-side-effect-import.handler.test.ts src/engine/compose/handlers/create-handlers.test.ts
```

Expected: PASS.

- [ ] **Step 5: Update examples and run focused verification**

Add `operations.md` examples for:

```ts
import 'dotenv/config'
import 'reflect-metadata'
```

Run:

```bash
pnpm vitest run src/core/manifest/manifest.schema.test.ts src/engine/plan/manifest-operation-builder.test.ts src/engine/plan/handlers/manifest-operation-handlers.test.ts src/engine/plan/manifest-operation-handler-registry.test.ts src/engine/ast/import-editor.test.ts src/engine/compose/handlers/ast-add-side-effect-import.handler.test.ts src/engine/compose/handlers/create-handlers.test.ts
pnpm typecheck
```

Expected: all listed tests pass and `tsc --noEmit -p tsconfig.json` exits cleanly.

- [ ] **Step 6: Commit the change**

```bash
git add src/core/manifest/manifest-operation.schema.ts src/core/manifest/manifest-operation.ts src/core/generation/ast-operation.ts src/engine/plan/handlers/ast-add-side-effect-import-manifest-operation.handler.ts src/engine/plan/handlers/create-manifest-operation-handlers.ts src/engine/plan/handlers/manifest-operation-handlers.test.ts src/engine/plan/manifest-operation-builder.test.ts src/core/manifest/manifest.schema.test.ts src/engine/plan/manifest-operation-handler-registry.test.ts src/engine/ast/import-editor.ts src/engine/ast/import-editor.test.ts src/engine/compose/handlers/ast-add-side-effect-import.handler.ts src/engine/compose/handlers/ast-add-side-effect-import.handler.test.ts src/engine/compose/handlers/create-handlers.ts src/engine/compose/handlers/create-handlers.test.ts operations.md
git commit -m "feat: add side-effect import operation"
```

## Deferred Backlog

These are intentionally not part of the near-term roadmap, but future sessions can revisit them if real use cases appear:

- `ast.add-namespace-import` for patterns like `import * as Sentry from '@sentry/node'`
- explicit ordering hints such as `before` / `after` constraints between independent bootstrap statements
- standalone constructor statements such as `new Xpto(...)` with no assignment
- generic statement injection or broad arbitrary-expression statements

## Self-Review

- Spec coverage: this roadmap covers the four recommended next capabilities and includes schema, planning, compose, editor, docs, and verification work for each.
- Placeholder scan: all tasks include concrete files, commands, and representative code shapes; no placeholder text remains.
- Type consistency: the roadmap uses `ast.nest.add-bootstrap-function-call`, `await`, `ast.add-default-import`, and `ast.add-side-effect-import` consistently across manifest, generation, editor, and compose layers.

Plan complete and saved to `docs/superpowers/plans/2026-05-05-bootstrap-future-operations-roadmap.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
