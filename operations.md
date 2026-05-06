# Manifest Operation Examples

This file shows example manifest snippets for the current bootstrap-related AST operations and the TypeScript they produce in `src/main.ts`.

## `ast.nest.add-bootstrap-call`

Use this when you want to call a method on the Nest app instance, such as `app.useGlobalPipes(...)` or `app.enableCors(...)`.

### Example: `app.useGlobalPipes(new ValidationPipe(...))`

```ts
{
  type: 'ast.nest.add-bootstrap-call',
  target: 'src/main.ts',
  appVar: 'app',
  call: {
    method: 'useGlobalPipes',
    arguments: [
      {
        kind: 'new',
        constructor: { kind: 'identifier', name: 'ValidationPipe' },
        arguments: [
          {
            kind: 'object',
            properties: [
              {
                key: 'transform',
                value: { kind: 'boolean', value: true },
              },
            ],
          },
        ],
      },
    ],
  },
}
```

Renders as:

```ts
app.useGlobalPipes(new ValidationPipe({ transform: true }))
```

### Example: `app.useLogger(app.get(Logger))`

```ts
{
  type: 'ast.nest.add-bootstrap-call',
  target: 'src/main.ts',
  appVar: 'app',
  call: {
    method: 'useLogger',
    arguments: [
      {
        kind: 'call',
        callee: {
          kind: 'member',
          object: 'app',
          property: 'get',
        },
        arguments: [{ kind: 'identifier', name: 'Logger' }],
      },
    ],
  },
}
```

Renders as:

```ts
app.useLogger(app.get(Logger))
```

### Example: `app.enableCors({ credentials: true })`

```ts
{
  type: 'ast.nest.add-bootstrap-call',
  target: 'src/main.ts',
  appVar: 'app',
  call: {
    method: 'enableCors',
    arguments: [
      {
        kind: 'object',
        properties: [
          {
            key: 'credentials',
            value: { kind: 'boolean', value: true },
          },
        ],
      },
    ],
  },
}
```

Renders as:

```ts
app.enableCors({ credentials: true })
```

## `ast.nest.add-bootstrap-variable`

Use this when you want to declare a local variable in `bootstrap()`, with either `const` or `let`.

### Example: `const xpto = new Xpto(params)`

```ts
{
  type: 'ast.nest.add-bootstrap-variable',
  target: 'src/main.ts',
  declarationKind: 'const',
  name: 'xpto',
  initializer: {
    kind: 'new',
    constructor: { kind: 'identifier', name: 'Xpto' },
    arguments: [{ kind: 'identifier', name: 'params' }],
  },
}
```

Renders as:

```ts
const xpto = new Xpto(params)
```

### Example: multiple constructor arguments and an object literal

```ts
{
  type: 'ast.nest.add-bootstrap-variable',
  target: 'src/main.ts',
  declarationKind: 'const',
  name: 'client',
  initializer: {
    kind: 'new',
    constructor: { kind: 'identifier', name: 'ApiClient' },
    arguments: [
      { kind: 'string', value: 'https://api.example.com' },
      { kind: 'number', value: 5000 },
      {
        kind: 'object',
        properties: [
          {
            key: 'retries',
            value: { kind: 'number', value: 3 },
          },
          {
            key: 'enabled',
            value: { kind: 'boolean', value: true },
          },
        ],
      },
    ],
  },
}
```

Renders as:

```ts
const client = new ApiClient('https://api.example.com', 5000, {
  retries: 3,
  enabled: true,
})
```

### Example: `let currentLogger = app.get(Logger)`

```ts
{
  type: 'ast.nest.add-bootstrap-variable',
  target: 'src/main.ts',
  declarationKind: 'let',
  name: 'currentLogger',
  initializer: {
    kind: 'call',
    callee: {
      kind: 'member',
      object: 'app',
      property: 'get',
    },
    arguments: [{ kind: 'identifier', name: 'Logger' }],
  },
}
```

Renders as:

```ts
let currentLogger = app.get(Logger)
```

## `ast.nest.add-bootstrap-method-call`

Use this when you want to call a method on a local variable or member expression in `bootstrap()`, such as `xpto.configure(...)` or `services.logger.flush()`.

### Example: `xpto.method()`

```ts
{
  type: 'ast.nest.add-bootstrap-method-call',
  target: 'src/main.ts',
  receiver: {
    kind: 'identifier',
    name: 'xpto',
  },
  method: 'method',
  arguments: [],
}
```

Renders as:

```ts
xpto.method()
```

### Example: `xpto.configure('abc', 42, { enabled: true })`

```ts
{
  type: 'ast.nest.add-bootstrap-method-call',
  target: 'src/main.ts',
  receiver: {
    kind: 'identifier',
    name: 'xpto',
  },
  method: 'configure',
  arguments: [
    { kind: 'string', value: 'abc' },
    { kind: 'number', value: 42 },
    {
      kind: 'object',
      properties: [
        {
          key: 'enabled',
          value: { kind: 'boolean', value: true },
        },
      ],
    },
  ],
}
```

Renders as:

```ts
xpto.configure('abc', 42, { enabled: true })
```

### Example: `services.logger.flush()`

```ts
{
  type: 'ast.nest.add-bootstrap-method-call',
  target: 'src/main.ts',
  receiver: {
    kind: 'member',
    object: 'services',
    property: 'logger',
  },
  method: 'flush',
  arguments: [],
}
```

Renders as:

```ts
services.logger.flush()
```

### Example: `app.enableShutdownHooks()`

```ts
{
  type: 'ast.nest.add-bootstrap-method-call',
  target: 'src/main.ts',
  receiver: {
    kind: 'identifier',
    name: 'app',
  },
  method: 'enableShutdownHooks',
  arguments: [],
}
```

Renders as:

```ts
app.enableShutdownHooks()
```

## Expression Cheat Sheet

These are the expression shapes currently supported inside bootstrap operation arguments and variable initializers.

### `identifier`

```ts
{ kind: 'identifier', name: 'Logger' }
```

Renders as:

```ts
Logger
```

### `string`

```ts
{ kind: 'string', value: 'hello' }
```

Renders as:

```ts
'hello'
```

### `number`

```ts
{ kind: 'number', value: 42 }
```

Renders as:

```ts
42
```

### `boolean`

```ts
{ kind: 'boolean', value: true }
```

Renders as:

```ts
true
```

### `null`

```ts
{ kind: 'null' }
```

Renders as:

```ts
null
```

### `array`

```ts
{
  kind: 'array',
  items: [
    { kind: 'string', value: 'a' },
    { kind: 'string', value: 'b' },
  ],
}
```

Renders as:

```ts
['a', 'b']
```

### `object`

```ts
{
  kind: 'object',
  properties: [
    { key: 'enabled', value: { kind: 'boolean', value: true } },
    { key: 'retries', value: { kind: 'number', value: 3 } },
  ],
}
```

Renders as:

```ts
{ enabled: true, retries: 3 }
```

### `member`

```ts
{ kind: 'member', object: 'services', property: 'logger' }
```

Renders as:

```ts
services.logger
```

### `call`

```ts
{
  kind: 'call',
  callee: { kind: 'identifier', name: 'createLogger' },
  arguments: [{ kind: 'string', value: 'api' }],
}
```

Renders as:

```ts
createLogger('api')
```

### `new`

```ts
{
  kind: 'new',
  constructor: { kind: 'identifier', name: 'ValidationPipe' },
  arguments: [],
}
```

Renders as:

```ts
new ValidationPipe()
```
