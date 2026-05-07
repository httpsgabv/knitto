# Knitto Manifest Operations Design

## Goal

Implement 9 additional manifest operations in `knitto` using the existing manifest -> plan -> generation -> compose architecture, preserving idempotency, conflict-first safety, and focused unit coverage.

## Scope

This design covers:

1. Fixing `copy-file` overwrite behavior
2. Adding `upsert-env`
3. Adding `append-lines`
4. Adding `merge-docker-compose`
5. Adding `ast.nest.merge-factory-options`
6. Adding `add-package-scripts`
7. Adding `ast.add-default-import`
8. Adding `ast.add-namespace-import`
9. Adding `merge-json`

This design does not introduce a new planning or execution abstraction. Each operation follows the project's existing explicit registration and handler pattern.

## Existing Architecture

The current codebase already separates concerns in a way that should be preserved:

1. Manifest validation and typing live in `src/core/manifest/*`.
2. Generation operation types live in `src/core/generation/*`.
3. Manifest-to-generation expansion lives in `src/engine/plan/handlers/*`.
4. Execution handlers live in `src/engine/compose/handlers/*`.
5. AST mutation logic lives in focused editors under `src/engine/ast/*`.
6. File merge logic lives in focused helpers under `src/engine/merge/*`.

The new work should extend these layers rather than collapsing them into broader generic services.

## Chosen Approach

Use the existing architecture and add small, operation-specific handlers plus focused merger/editor methods.

### Why this approach

1. It matches the project's current design and test organization.
2. It keeps manifest schema concerns separate from execution concerns.
3. It keeps conflict behavior explicit per operation.
4. It minimizes regression risk in the existing operations.

### Alternatives considered

1. A generic structured file merger for env, JSON, scripts, docker compose, and lines.
   This would reduce class count but would centralize unrelated behaviors and weaken the clear operation boundaries the project already uses.
2. Folding new behaviors into existing handlers with optional flags.
   This would save files but would make the existing operation handlers less focused and harder to test.

## Operation Groups

The work naturally falls into four groups.

### 1. Plain file operations

1. `copy-file` overwrite fix
2. `upsert-env`
3. `append-lines`

These are execution-time file mutations with simple deterministic semantics.

### 2. Structured configuration merges

1. `add-package-scripts`
2. `merge-json`
3. `merge-docker-compose`

These require parsing target content, merging according to operation-specific rules, and either producing a stable result or throwing a conflict.

### 3. Generic import AST operations

1. `ast.add-default-import`
2. `ast.add-namespace-import`

These belong in `ImportEditor`, alongside the existing named and side-effect import helpers.

### 4. Nest-specific AST operations

1. `ast.nest.merge-factory-options`

This belongs in `NestBootstrapEditor`, alongside the existing Nest AST behavior.

## Data Flow

Each new operation follows the same pipeline.

### Manifest layer

Add Zod schemas in `src/core/manifest/manifest-operation.schema.ts`.

This layer keeps manifest field names as authored in `knitto.json`, including:

1. `values`
2. `lines`
3. `scripts`
4. `options`
5. `imports`
6. `expression`

### Generation layer

Add generation operation types in:

1. `src/core/generation/file-operation.ts`
2. `src/core/generation/ast-operation.ts`

These types represent normalized internal execution data after manifest expansion.

### Planning layer

Add one manifest operation handler per new operation in `src/engine/plan/handlers/*` and register each in `createManifestOperationHandlers()`.

Each handler is responsible only for:

1. describing the operation
2. resolving source and target paths where relevant
3. converting manifest input into the internal generation operation shape

### Compose layer

Add or extend compose handlers in `src/engine/compose/handlers/*` and register them in `createHandlers()`.

Each handler delegates to a focused file merger or AST editor rather than implementing complex logic inline.

### Utilities layer

Add focused helpers where behavior is reusable and naturally cohesive:

1. env upsert merger
2. append-lines merger/editor
3. JSON merger
4. Docker Compose merger
5. import editor methods for default and namespace imports
6. Nest bootstrap editor method for factory option merge

## Sorting Order

Update `src/engine/plan/operation-sorter.ts` so operations run in this order:

1. kit `copy-file`
2. `merge-package-json`
3. `add-package-scripts`
4. `merge-json`
5. `append-env`
6. `upsert-env`
7. `append-lines`
8. `merge-docker-compose`
9. feature `copy-file`
10. AST operations
11. `append-readme`

This ensures config files and copied source files exist before AST patching begins, while README updates remain late-stage content composition.

## Detailed Behavior

### 1. `copy-file` overwrite fix

#### Intent

Respect `overwrite` during execution rather than always writing the target file.

#### Behavior

1. If target does not exist, write the file.
2. If target exists and `overwrite` is `true`, overwrite it.
3. If target exists and `overwrite` is `false`, leave it unchanged.
4. Preserve variable rendering semantics for writes.

#### Design note

Rendering should occur only when the write will happen. This avoids unnecessary work and keeps the implementation aligned with the real side effect.

### 2. `upsert-env`

#### Manifest shape

```json
{
  "type": "upsert-env",
  "target": ".env",
  "values": {
    "DATABASE_URL": "postgresql://postgres:postgres@localhost:5432/nest_api?schema=public",
    "POSTGRES_USER": "postgres"
  }
}
```

#### Behavior

1. Create target file if missing.
2. Preserve unrelated lines and comments.
3. If a key already exists, replace the first matching `KEY=...` line with the manifest value.
4. If a key does not exist, append it.
5. Do not introduce duplicate keys for the values being upserted.
6. Keep a trailing newline.

#### Parsing model

This should use simple line-based parsing instead of a full dotenv parser. The operation only needs deterministic key replacement and append behavior, not shell expansion semantics.

### 3. `append-lines`

#### Manifest shape

```json
{
  "type": "append-lines",
  "target": ".gitignore",
  "lines": ["/src/generated/prisma", ".env"]
}
```

#### Behavior

1. Create target file if missing.
2. Preserve existing content and order.
3. Append only lines that are not already present as exact string matches.
4. Do not add duplicates.
5. Keep a trailing newline.

### 4. `merge-docker-compose`

#### Manifest shape

```json
{
  "type": "merge-docker-compose",
  "source": "docker-compose.yml",
  "target": "docker-compose.yml",
  "strategy": "deep-merge"
}
```

#### Behavior

1. If target is missing, copy or render source to target.
2. If target exists, parse both YAML documents.
3. Only merge supported top-level Compose maps:
   - `services`
   - `volumes`
   - `networks`
   - `configs`
   - `secrets`
4. Add missing keys.
5. If an existing key has equivalent content, do nothing.
6. If an existing key has different content, throw a conflict.

#### Conflict model

When the same service name exists in both files, list-valued fields such as `ports`, `volumes`, and `depends_on` are not merged. Any difference within the overlapping service definition is a conflict. This preserves the tool's safety-first posture.

#### Serialization

Output should be normalized readable YAML. A small YAML dependency is acceptable for this operation if needed.

### 5. `ast.nest.merge-factory-options`

#### Manifest shape

```json
{
  "type": "ast.nest.merge-factory-options",
  "target": "src/infra/main.ts",
  "options": {
    "bodyParser": false,
    "bufferLogs": true
  }
}
```

#### Behavior

1. Locate `NestFactory.create(...)` inside `bootstrap()`.
2. If no second argument exists, add an object literal.
3. If the second argument is an object literal, merge properties.
4. If an existing property has the same rendered value, do nothing.
5. If an existing property has a different value, throw a conflict.
6. If the second argument exists but is not an object literal, throw an unsupported-shape error.

#### Expression model

The `options` values should reuse the existing `AstBootstrapExpression` model so callers can provide booleans, strings, identifiers, calls, objects, arrays, and other already-supported expression shapes.

### 6. `add-package-scripts`

#### Manifest shape

```json
{
  "type": "add-package-scripts",
  "target": "package.json",
  "scripts": {
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev"
  }
}
```

#### Behavior

1. Create `scripts` object if missing.
2. Add missing script entries.
3. If an existing script has the same value, do nothing.
4. If an existing script has a different value, throw a conflict.

#### Design note

This is append-only behavior. It does not overwrite existing differing scripts.

### 7. `ast.add-default-import`

#### Manifest shape

```json
{
  "type": "ast.add-default-import",
  "target": "src/infra/main.ts",
  "default": "helmet",
  "from": "helmet"
}
```

#### Behavior

1. Add a default import when absent.
2. If the module already has named imports, combine them into a valid default-plus-named declaration.
3. If the same default local name already exists, do nothing.
4. If a different default local name already exists from the same module, throw a conflict.

### 8. `ast.add-namespace-import`

#### Manifest shape

```json
{
  "type": "ast.add-namespace-import",
  "target": "src/infra/sentry/instrument.ts",
  "namespace": "Sentry",
  "from": "@sentry/nestjs"
}
```

#### Behavior

1. Add a namespace import when absent.
2. If the same namespace import already exists from the same module, do nothing.
3. If a different namespace local name already exists from the same module, throw a conflict.
4. If default or named imports from the same module already exist, emit a separate import declaration rather than forcing an invalid combined declaration.

### 9. `merge-json`

#### Manifest shape

```json
{
  "type": "merge-json",
  "source": "tsconfig.patch.json",
  "target": "tsconfig.json",
  "strategy": "deep-merge"
}
```

#### Behavior

1. If target is missing, copy or render source to target.
2. If target exists, parse both source and target as JSON.
3. Plain objects deep merge by key.
4. Arrays unique-append, preserving target items first and appending only new source items.
5. Primitive values:
   - add when target key is missing
   - no-op when value is equivalent
   - conflict when values differ
6. Serialize with 2-space indentation and a trailing newline.

#### Array rule

The array merge semantics are intentionally append-oriented because this operation is named `merge-json`. A target array like `["X"]` merged with source `["Y", "Z"]` becomes `["X", "Y", "Z"]`.

## Error Handling

Use the existing `KnittoError` and `Errors` pattern.

New error codes will likely be needed for:

1. JSON primitive conflicts
2. Docker Compose key conflicts
3. default import conflicts
4. namespace import conflicts
5. Nest factory options conflicts
6. unsupported Nest factory option shape
7. package script conflicts

Errors should remain specific enough that tests can assert the exact failure mode.

## Testing Strategy

Each operation should be covered at the smallest sensible layer, plus registry coverage where already conventional.

### Planning tests

Add or extend unit tests for each manifest operation handler to verify:

1. manifest fields are mapped correctly
2. source and target path resolution is correct
3. generation operation descriptions and payloads are correct

### Execution tests

Add or extend compose handler tests to verify final file content or editor interaction.

### Utility/editor tests

Add focused tests around:

1. env upsert merge cases
2. append-lines behavior
3. JSON merge semantics
4. Docker Compose merge semantics
5. import editor default and namespace behavior
6. Nest bootstrap factory option behavior

### Required scenarios

At minimum, cover:

1. `copy-file` skip when overwrite is false
2. `copy-file` overwrite when true
3. `upsert-env` create file
4. `upsert-env` replace existing key
5. `upsert-env` append missing key without duplicates
6. `append-lines` create file
7. `append-lines` append only missing lines
8. `add-package-scripts` create `scripts`
9. `add-package-scripts` append missing scripts
10. `add-package-scripts` conflict on differing script
11. `merge-json` target missing
12. `merge-json` deep merge objects
13. `merge-json` unique-append arrays
14. `merge-json` primitive conflict
15. `merge-docker-compose` target missing
16. `merge-docker-compose` merge service into existing file
17. `merge-docker-compose` merge volumes
18. `merge-docker-compose` same key same content no-op
19. `merge-docker-compose` same key different content conflict
20. `ast.add-default-import` add into empty file state
21. `ast.add-default-import` combine with named imports
22. `ast.add-default-import` conflict on different local default name
23. `ast.add-namespace-import` add namespace import
24. `ast.add-namespace-import` conflict on different namespace name
25. `ast.nest.merge-factory-options` add missing options object
26. `ast.nest.merge-factory-options` merge into existing object literal
27. `ast.nest.merge-factory-options` conflict on different value
28. `ast.nest.merge-factory-options` unsupported second argument shape

## File Impact

Expected files to change include:

1. `src/core/manifest/manifest-operation.schema.ts`
2. `src/core/generation/file-operation.ts`
3. `src/core/generation/ast-operation.ts`
4. `src/engine/plan/handlers/create-manifest-operation-handlers.ts`
5. `src/engine/compose/handlers/create-handlers.ts`
6. `src/engine/plan/operation-sorter.ts`
7. `src/engine/ast/import-editor.ts`
8. `src/engine/ast/nest-bootstrap-editor.ts`
9. new manifest operation handlers under `src/engine/plan/handlers/*`
10. new compose handlers under `src/engine/compose/handlers/*`
11. new merge helpers under `src/engine/merge/*`
12. tests for all of the above

`src/cli/bootstrap.ts` only needs changes if one of the new handlers requires a newly wired dependency that is not already available through the execution context.

## Assumptions

1. Existing expression rendering logic in the AST layer can be reused for bootstrap option values.
2. A small YAML dependency is acceptable if current utilities do not already provide safe YAML parsing and serialization.
3. Conflict-first behavior is preferable to implicit overwrites for JSON, Docker Compose, scripts, and AST operations.

## Non-Goals

1. No broad refactor of the planner or executor.
2. No attempt to merge arbitrary unsupported Nest AST shapes.
3. No attempt to semantically merge arbitrary Docker Compose list fields.
4. No backward-compatibility layer for alternate manifest field spellings.
5. No formatting-only changes unrelated to these operations.
