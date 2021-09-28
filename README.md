# @squall.io/context

A dependency injection container, for JavaScript

## Getting Started
### Licence

This library is published under [MIT license](./LICENSE)

### Installation

```shell
yarn add @squall.io/context
```

### Developement

```shell
git clone https://github.com/squall-io/context.git
```

### Test

```shell
yarn test
```

## Usage

### Create a context

```javascript
import { Context } from '@squall.io/context';

const context = new Context();
```

### Create a child context

```javascript
import { Context } from '@squall.io/context';

const parent = new Context();
const child = Context.from( parent );
```

### Provide context with dependency factories

```javascript
const timeoutToken = Symbol( 'my timeout literal token' );

context.provide( [ timeoutToken ], context => 1_000 );
```

or with a class

```javascript
class TimeoutStrategy {
    constructor( timeout ) {
        this.timeout = timeout;
    }
}

context.provide( [ TimeoutStrategy ], context => new TimeoutStrategy( 1_000 ) );
```

or provide multiple keys at once

```javascript
class TimeoutStrategy {
    constructor( timeout ) {
        this.timeout = timeout;
    }
}
const timeoutToken = Symbol( 'my timeout literal token' );
context.provide( [ TimeoutStrategy, timeoutToken ],
    context => new TimeoutStrategy( 1_000 ),
    context => 1_000,
);
```

> **NOTE:** Factory functions can be async as well (or just return a Promise)

So we can write:

```javascript
class TimeoutStrategy {
    constructor( timeout ) {
        this.timeout = timeout;
    }
}

const timeoutToken = Symbol( 'my timeout literal token' );

context.provide( [ TimeoutStrategy, timeoutToken ],
    async context => {
        const [ timeout ] = await context.inject( timeoutToken );

        return new TimeoutStrategy( timeout );
    },
    context => 1_000,
);
```

> **NOTE:** If our dependency class accepts a single argument which is the context,
or no argument at all, we don't need to be verbose for that.

```javascript
class TimeoutStrategy {
    constructor( context ) {
        context.inject( timeoutToken )
            .then( ([ timeout ]) => this.timeout = timeout );
    }
}

const timeoutToken = Symbol( 'my timeout literal token' );

context.provide( [ TimeoutStrategy, timeoutToken ], null, () => 1_000 );
```

### Inject dependencies

```javascript
// tokens: array of symbols or class references (constructors)
context.inject( ...tokens );

const [dependencyZero, dependencyOne, dependencyTwo, dependencyZero] = await context
    .inject( tokenZero, tokenOne, tokenTwo, tokenZero );
```

> **NOTE:** It is guaranteed that factory methods for each token is called at most once.

> **NOTE:** If a context can find a factory for some token, it tries to delecate to the parent context.

> **NOTE:** The context on which `inject` is called takes precedence over its ancestors.
    This is useful to scope some action, or override in tests.

Errors are as follow:

+ `Context.UNKNOWN_KEYS` - If some keys (a.k.a tokens) are found in the context three,
    an `Error` is thrown, with its `.name` equals `UNKNOWN_KEYS`
+ `Context.FACTORY_FAILURE` - If there are error while running a factory for some keys
    (a.k.a tokens), then an `Error` is thrown, with its `.name` equals `FACTORY_FAILURE`.
    The original error can be accessed as `error.suppressed`.

## TypeScript support

The package is published to NPM registry along TypeScript definition files.

Our last example would go:

```typescript
class TimeoutStrategy {
    constructor( context ) {
        context.inject( timeoutToken )
            .then( ([ timeout ]) => this.timeout = timeout );
    }
}

const timeoutToken: Context.Token<number> = Symbol( 'my timeout literal token' );
//                  ^^^^^^^^^^^^^^^^^^^^^
// `Context.Token<number>` let TypeScript know that the token is meant for a number
// This is important to infer type definition when injecting dependencies.
//
// Doing otherwise will result in `unknown` type being infered

context.provide( [ TimeoutStrategy, timeoutToken ] as const, null, () => 1_000 );
//                                                 ^^^^^^^^
// `as const` forces TypeScript to mean tuple instead of array, which matters
// if you want to rely on TypeScript to check that factories count & return type
// matches the number of tokens provided.
//
// Doing otherwise might reveal only at runtime
```

> **NOTE:** Nothing prevents you from writing `Context.Token<TimeoutStrategy>` but we
    prefer symbols for literals only.

> **NOTE:** `context.inject(Context.Token<Promise<string>>)` will result in
    `Promise<[string]>` and not `Promise<Promise<[string]>>` i.e promises are unboxed.

## Roadmap

+ Support reactive API, when a token's factory is overriden, while being injected somewhere
+ Support opt-in strategies to throw errors vs. return null/undefined
+ Add Ecma-Script decorators for OOP clean experience
+ Support dependencies lifecycle (CREATED, UPDATED, INJECTED, REFENCED, UNREFENCED for eg.)

## Contributors

+ [Salathiel Genese](https://salathiel.genese.name)

## Contribution

+ Should you find some errors? Please, report them or submit a pull request.
+ To date, no linting tool has been configured, so hope you will follow same practice,
    or if suggesting new one, apply it to the full project.
+ Should you find the project useful? Let us know how so, and how we can improve it.

<br/>
With thanks,
<br/>
Salathiel G.
