@squall.io/context
===

A CDI (Context and Dependency Injection) container, designed JavaScript asynchronicity.

JavaScript async is better known today through the `Promise` API and `RxJS`, best successors to callbacks' hell age.
And they are best at what they do... Until they aren't: dependency injection, context and its propagation.

```typescript
// transfer.ts
import { credit, debit } from './operations';

const [debitMetadata, debitContext]  = await debit(sender, amount).context;
// NOTE: we pass along the context, for transaction reuse
const creditMetadata = await credit(recipient, amount, debitContext);
```

Provided the following...

```typescript
// operations.ts
import { CreditMetadata, DebitMetadata } from './model/metadata';
import { Promise as ContextPromise } from '@squall.io/context';
import { TRANSACTION_ID_TOKEN, start } from './transactional';
import { Sender, Recipient } from './model/actors';

export const debit = (sender: Sender, amount: number): ContextPromise<DebitMetadata> => { /* ... */ }

export const credit = (recipient: Recipient, amount: number, ctx?: ContextPromise): ContextPromise<CreditMetadata> => {
    let transactionId: string;
    
    try {
        // If a transaction is started in the currrent context, re-use it.
        // Also, if no context was given, just start a new transaction.
        transactionId = ctx?.inject(TRANSACTION_ID_TOKEN) ?? start();
    } catch (e) {
        // If, for eg., no transaction was started and registered in the given context,
        // we would get an error throw. And hence, need to start one
        transactionId = start();
    }
    
    ctx ??= new ContextPromise().provide(TRANSACTION_ID_TOKEN, transactionId);
    
    // Run the credit operation in transaction, reusing an existing one if possible
    
    return ContextPromise.resolve(creditMetadata, ctx);
}
```

## Table of Content

+ [Getting Started](#getting-started)
    + [License](#license)
    + [Usage](#usage)
+ [API Documentation](#api-documentation)
    + [Context](#context)
        + [Context Constructors](#context-constructor)
        + [Context.provide](#context.provide)
        + [Context.inject](#context.inject)
        + [Context.hasOwn](#context.hasOwn)
        + [Context.has](#context.has)
    + [Promise](#promise)
        + [Promise Constructor](#promise-constructor)
        + [Promise.finally](#promisefinally)
        + [Promise.catch](#promisecatch)
        + [Promise.then](#promisethen)
        + [Promise.context](#promisecontext)
        + [Promise::allSettled](#promiseallsettled)
        + [Promise::resolve](#promiseresolve)
        + [Promise::reject](#promisereject)
        + [Promise::race](#promiserace)
        + [Promise::all](#promiseall)
        + [Promise::any](#promiseany)
+ [Contribution](#contribution)
    + [Guidelines](#guidelines)
    + [Contributors](#contributors)
    + [Upcoming](#upcoming)

## Getting Started

### License

[MIT license](./LICENSE)

### Usage

```shell
# shell
yarn add @squall.io/context --save
```

```typescript
// typescript
import {Context} from '@squall.io/context'; // <<< ES2015-compliant import 
// Consider '@squall.io/context/commonjs', '@squall.io/context/systemjs',
// '@squall.io/context/es2015', '@squall.io/context/amd'
// '@squall.io/context/umd'

class Brand {
    constructor(public name: string, public logoUrl?: string) {
    }
}

const PI_TOKEN: Context.Token<Promise<number>> = Symbol('PI_TOKEN');

const context = new Context()
    .provide('host', () => 'localhost')
    .provide('host', 'local', () => '127.0.0.1')
    .provide('host', 'network', () => '192.168.8.104')

    .provide(Brand, new Brand('Google'))
    .provide(Brand, 'media', new Brand('Netfix'))
    .provide(Brand, ['ads', 'social'], new Brand('Meta'))

    .provide(PI_TOKEN, 'javascript', Promise.resolve(Math.PI))
    .provide(PI_TOKEN, async () => /* asynchronous computation if accurate PI value */ 3.14);
///
/// Somewhere later on code
///
context.inject('host');             // 'locahost'
context.inject('host', 'local');    // '127.0.0.1'
context.inject('host', 'network');  // '192.168.8,104'

context.inject(Brand);              // Brand { name: 'Google' }
context.inject(Brand, 'media');     // Brand { name: 'Netfix' }
context.inject(Brand, 'ads');       // Brand { name: 'Meta' }
context.inject(Brand, 'social');    // Brand { name: 'Meta' }

context.inject(PI_TOKEN);               // Promise<number = 3.14>
context.inject(PI_TOKEN, 'javascript'); // Promise<number = Math.PI>
```

## API Documentation

Let's start by establishing some terms and expressions, in this CDI implementation, as they will be used moving forward.

+ **Qualifier**: Beans are identified with a token. But variant(s) or specializations of the same beans can be tagged
  with a qualifier. But a qualifier is optional.

+ **Default Qualifier**: When providing beans definition to a context, it denotes the absence of qualifier beside the
  token. And, when inject a bean, denote either the absense of qualifier or that there is actually a single candidate
  bean from that token. _(This implementation do not expose the developers with default qualifiers.)_

+ **Context Level**: A context is somewhat related to the programming idea of scope. As such, contexts are hierarchical.
  And a context level is just a node in the three of context.
  > This implementation opinionated for multi-parents' context-level, with the latter parent having
  > precedence over the former, when we have to traverse the ancestor tree.

+ **Definition Site**: The place in code where a bean definition is being provided to a context:
  ```typescript
  // An example
  context.provide('name', 'Google');
  // Other example
  context.provide('name', 'stock', 'GOOG');
  // Another example
  context.provide('name', 'legal', 'Google LLC');
  ```

+ **Injection Site**: The place in code where a bean is retrieved from a context.
  ```typescript
  // An example
  context.inject('name'); // 'Google'
  // Other example
  context.inject('name', 'stock'); // 'GOOG'
  // Another example
  context.inject('name', 'legal'); // 'Google LLC'
  ```

+ **Bean Definition**: A value or a function that will return a value (a bean). When the bean definition is a function,
  we also refer to it as a _factory bean definition_.
  ```typescript
  context.provide('firstname', 'John');          // 'John' is the bean
  context.provide('lastname', () => 'DOE');      // 'DOE' is the bean
  context.provide('fullname', () => 'John DOE'); // () => 'John DOE' is a factory bean definition
  ```

+ **Empty**: Strictly equals to `null` or `undefined`.

+ **TokenSymbol**: A JavaScript symbol, decorated to capture a typescript type.
  ```typescript
  namespace Context { 
    export type TokenSymbol<T> = symbol & Record<never, T>;
    // ...
  }
  ```

+ **Factory**: A JavaScript function, that accepts a context as a parameter and returns a bean of generic type.
  ```typescript
  namespace Context { 
    export type Factory<T> = {
        (context: Context, token: Context.Token<T>, ...qualifiers: string[]): T;
    };
    // ...
  }
  ```

+ **Token**: A type for bean definition tokens, capturing a bean type and its variants.
  ```typescript
  namespace Context { 
    export type Token<T> = string | Context.TokenSymbol<T> | Context.Constructor<T>;
    // ...
  }
  ```

+ **InjectOptions**: A type for a key that identify a bean, and eventually, its variants.
  ```typescript
  namespace Context { 
    export type InjectOptions = {
      forceEvaluation?: boolean;
      qualifier?: string;
    };
    // ...
  }
  ```

### Context

#### Context Constructor

+ `new Context(...parents: Context[])`
  <br/>
  Create a context inheriting from none or more parents;
+ `new Context(options: Context.DeepPartial<Context.Configuration>, ...parents: Context[])`
  <br/>
  Create a context, eventually overriding its default configuration, inheriting from none or more parents.
  <br/>
  > Context configuration are not inherited: i.e. each context got its own configuration, which apply when calling
  > `context.provide`.

**PARAMETERS**

+ `parents`: none or more spread contexts to become parent/s of the context we are creating;
+ `options.factory.lazyFunctionEvaluation` (default `false`): When `false`, evaluate factory bean definitions right
  away at bean definition time. Evaluate it at injection time otherwise (`true`);
+ `options.factory.lazyValidation` (default `false`): When `false`, validate that bean is not empty _(see the
  definition of empty above)_ at definition time. Validate it at injection time otherwise (i.e `true`).
  > When the resolved bean is a `Promise`, eager vs. lazy validation has little to no value. Therefore, emptiness is
  > assessed both against the promise and its resolved value. This too, is opinionated.

#### Context.provide

+ `context.provide(token: string, factory: Context.Factory<unknown>): this`
  <br/>
  Provide a bean definition mapped to a `token`, using the default qualifier.
    + **returns**
        + the context on which the `provide` method was called on.
    + **throws**
        + `Error` where `error.name === Context.ERR_DUPLICATE_FACTORY`, when a bean definition with the given `token`
          already exists in this context, under the default qualifier.
        + `Error` where `error.name === Context.ERR_EMPTY_VALUE` when a bean definition resolves to an empty value and
          the
          context's `configuration.factory.lazyValidation === false`.
          > With `configuration.factory.lazyValidation === false`, this error is:
          > + thrown if the resolved bean is empty;
          > + not thrown if the resolved bean is a `Promise`;
          > + not thrown if `configuration.factory.lazyFunctionEvaluation === true`.
+ `context.provide(token: string, qualifiers: string|string[], factory: Context.Factory<unknown>): this`
  <br/>
  Provide a bean definition mapped to a `token`, using the `qualifier/s` provided.
    + **returns**
        + the context on which the `provide` method was called on.
    + **throws**
        + `Error` where `error.name === Context.ERR_DUPLICATE_FACTORY` when a bean definition with the given `token`
          already
          exists in this context, under any of the provided `qualifier/s`;
        + `Error` where `error.name === Context.ERR_EMPTY_VALUE` when a bean definition resolves to an empty value and
          the
          context's `configuration.factory.lazyValidation === false`.
          > With `configuration.factory.lazyValidation === false`, this error is:
          > + thrown if the resolved bean is empty;
          > + not thrown if the resolved bean is a `Promise`;
          > + not thrown if `configuration.factory.lazyFunctionEvaluation === true`.
+ `context.provide<TK extends Token<any>>(token: TK, beanDefinition: T | Context.Factory<T>): this`
  <br/>
  Provide a bean definition mapped to a `token`, using the default qualifier.
    + **returns**
        + the context on which the `provide` method was called on.
    + **throws**
        + `Error` where `error.name === Context.ERR_DUPLICATE_FACTORY` when a bean definition with the given `token`
          already
          exists in this context, under default qualifier;
        + `Error` where `error.name === Context.ERR_EMPTY_VALUE` when a bean definition resolves to an empty value, and
          the
          context's `configuration.factory.lazyValidation === false`.
          > With `configuration.factory.lazyValidation === false`, this error is:
          > + thrown if the resolved bean is empty;
          > + not thrown if the resolved bean is a `Promise`;
          > + not thrown if the bean definition is a `Context.Factory<?>` and
              >   `configuration.factory.lazyFunctionEvaluation === true`.
+ `context.provide<TK extends Token<any>>(token: TK, qualifiers: string|string[], beanDefinition: T | Context.Factory<T>): this`
  <br/>
  Provide a bean definition mapped to a `token`, using the `qualifier/s` provided.
    + **returns**
        + the context on which the `provide` method was called on.
    + **throws**
        + `Error` where `error.name === Context.ERR_DUPLICATE_FACTORY` when a bean definition with the given `token`
          already
          exists in this context, under any of the provided `qualifier/s`;
        + `Error` where `error.name === Context.ERR_EMPTY_VALUE` when a bean definition resolve to an empty value and
          the
          context's `configuration.factory.lazyValidation === `false`.
          > With `configuration.factory.lazyValidation === false`, this error is:
          > + thrown if the resolved value is empty;
          > + not thrown if the resolved value is a `Promise`;
          > + not thrown if the bean definition is `Context.Factory<?>` and
              >   `configuration.factory.lazyFunctionEvaluation === true`.

#### Context.inject

> When processing its ancestors, a context goes through its parents, in reverse order, using depth-first algorithm and
> stops as soon as it finds a match: i.e. a bean or bean definition mapped to the given token and eventually, the given
> qualifier.

> When injecting a no-args constructor (i.e. `0 === constructor.length`), if that class is not [yet] a token in that
> context, will result in that context registering a definition of it under that class, under the given qualifier (or
> the default qualifier). An instance is created immediately without parameters.
>
> All the other rules apply eagerly since things couldn't be later: validation, caching, calls without qualifier bean
> resolution.

+ `context.inject(token: string): unknown`
  <br/>
  Retrieve the bean resolved from the bean definition mapped to the given `token`, in this context or its ancestors.
    + **returns**
        + the bean resolved from this context, for the given `token` (cached value if the bean was already computed):
            + when there is a bean definition, for this token, under default qualifier;
            + when there is a bean definition, for this token, under the only existing qualifier;
        + a rejected `Promise` with `Error` where `error.name === Context.ERR_EMPTY_VALUE` when the resolved bean is
          async
          (a promise) that resolves to an empty value.
    + **throws**
        + `Error` where `error.name === Context.ERR_UNDECIDABLE_BEAN` when both the following are true:
            + there is no bean definition mapped under default qualifier;
            + there are multiple qualified candidates under the given `token`;
        + `Error` where `error.name === Context.ERR_NO_BEAN_DEFINITION` when no bean definition is registered for the
          given
          `token`;
        + `Error` where `error.name === Context.ERR_EMPTY_VALUE` when the resolved bean is empty.
+ `context.inject(token: string, qualifier): unknown`
  <br/>
  Retrieve the bean resolved from the bean definition mapped to the given `token` under the given `qualifier`, in this
  context or its ancestors.
    + **returns**
        + the bean resolved from this context, for the given `token` under the given `qualifier` (cached value if the
          bean
          was already computed);
        + a rejected `Promise` with `Error` where `error.name === Context.ERR_EMPTY_VALUE` when the resolved bean is
          async
          (a promise) that resolves to an empty value.
    + **throws**
        + `Error` where `error.name === Context.ERR_NO_BEAN_DEFINITION` when no bean definition is registered for the
          given
          `token` under the give `qualifier`;
        + `Error` where `error.name === Context.ERR_EMPTY_VALUE` when the resolved bean is empty.
+ `context.inject<TK extends Token<infer T>>(token: TK): T`
  <br/>
  Retrieve the bean resolved from the bean definition mapped to the given `token`, in this context or its ancestors.
  <br/>
    + **returns**
        + the bean resolved from this context, for the given `token` (cached value if the bean was already computed):
            + when there is a bean definition, for this token, under default qualifier;
            + when there is a bean definition, for this token, under the only existing qualifier;
        + a rejected `Promise` with `Error` where `error.name === Context.ERR_EMPTY_VALUE` when the resolved bean is
          async
          (a promise) that resolves to an empty value.
    + **throws**
        + `Error` where `error.name === Context.ERR_UNDECIDABLE_BEAN` when both the following are true:
            + there is no bean definition mapped under default qualifier;
            + there are multiple qualified candidates under the given `token`;
        + `Error` where `error.name === Context.ERR_NO_BEAN_DEFINITION` when no bean definition is registered for the
          given
          `token`;
        + `Error` where `error.name === Context.ERR_EMPTY_VALUE` when the bean is empty.
+ `context.inject<TK extends Token<infer T>>(token: TK, qualifier: string): T`
  <br/>
  Retrieve the bean resolved from the bean definition mapped to the given `token` under the given `qualifier`, in this
  context or its ancestors.
    + **returns**
        + the bean resolved from this context, for the given `token` under the given `qualifier` (cached value if the
          bean
          was already computed);
        + a rejected `Promise` with `Error` where `error.name === Context.ERR_EMPTY_VALUE` when the resolved bean is
          async
          (a promise) that resolves to an empty value.
    + **throws**
        + `Error` where `error.name === Context.ERR_NO_BEAN_DEFINITION` when no bean definition is registered for the
          given
          `token` under the give `qualifier`;
        + `Error` where `error.name === Context.ERR_EMPTY_VALUE` when the resolved bean is empty.
+ `context.inject<TK extends Token<infer T>>(token: TK, injectOptions: Context.InjectOptions): T`
  <br>
    + See documentation for `context.inject<TK extends Token<infer T>>(token: TK): T` when `injectOptions.qualifier` is
      missing;
    + See documentation for `context.inject<TK extends Token<infer T>>(token: TK, qualifier: string): T` when
      `injectOptions.qualifier` is defined;
    + If `injectOptions.forceEvaluation === true`, then the cached bean is ignored IIF (If and only IF) the bean
      definition was a factory.

#### Context.hasOwn

+ `context.hasOwn(token: Context.Token<unknown>): boolean`
  <br/>
  **returns** a boolean:
    + `true` if the context called upon has a bean definition for the given `token` either with the default qualifier or
      there is only one qualified candidate;
    + `false` otherwise.
      > Returning `false` can have two meaning:
      > + There are multiple qualifiers under the given `token`, with none as the default qualifier
      > + There is no bean definition with the given `token` in the context called on
+ `context.hasOwn(token: Context.Token<unknown>, qualifier: string): boolean`
  <br/>
  **returns** a boolean:
    + `true` if the context called upon has a bean definition for the given `token` and `qualifier`;
    + `false` otherwise.

#### Context.has

+ `context.has(token: Context.Token<unknown>): boolean`
  <br/>
  **returns** a boolean:
    + `true` if the context called upon or one of its ancestors has a bean definition for the given `token` with the
      default qualifier (i.e. either provided without any qualifier or there is only one bean definition qualified);
    + `false` otherwise.
      > Note that the inspection for the default qualifier happen one context at a time and, `false` has one of two
      > meaning:
      > + There are multiple bean definitions under the given `token`, with none as default qualifier
      > + There is no bean definition with the given `token` across the context's tree
+ `context.has(token: Context.Token<unknown>, qualifier: string): boolean`
  <br/>
  **returns** a boolean:
    + `true` if the context called upon or its ancestors has a bean definition for the given `token` and `qualifier`;
    + `false` otherwise.

**PARAMETERS**

+ `token`: the identifier for the bean definition we are checking existence of.
+ `qualifier`: a string to narrow down the search amongst bean definition specializations.

### Promise

The `Promise` API have been part of JavaScript for a long time now: first as pert of the ecosystem, then officially
since ES2015. This implementation adds support for context-awareness and context propagation.

> NOTE: Conceptually, one could say that this implementation is a wrapper around ES2015 promise but that would only be
> conceptually-speaking. In practice, that would at least double the number of event-loops necessary to run promises
> callback. And this implementation is meant to either replace standard `Promise` or along it, seamlessly.
>
> And even TypeScript definitions are compatible.

Different contexts can be used/passed down at different level of the promise API. To reflect but also preserve that
understanding, we use the latest precedence rule to resolve with context will construct the new promises we return.

> For `async/await` compatibility, we provide the [`get context() { ... }`](#promisecontext) accessor so that you
> do not have to break your preferred writing style.

#### Promise Constructor

A promise constructor as you know it, expect it may also receive a context: `(executor, context?)`.

Now, the `executor` is a function that is called with two parameters - `executor: (resolve, reject) => void`:

+ `resolve(value, context?)`
+ `reject(reason, context?)`

Where each callback can bubble up the context it used, along the `value`/`reason`.
When given, callback context takes precedence over the constructor one (if any).

```typescript
import {Context, Promise as ContextPromise} from '@squall/context';

const ctorCtx = new Context();

// A promise that resolve to 1.
// No different than a legacy promise (without context)
new ContextPromise(res => res(1));

// A promise that resolve to 1, with ctorCtx as context
new ContextPromise(res => res(1), ctorCtx);

// A promise that resolve to 1, with context as the value passed to `res`
new ContextPromise(res => res(1, new Context()), ctorCtx);

// A promise that reject with -1, with context as the value passed to `rej`
new ContextPromise((_, rej) => rej(-1, new Context()), ctorCtx);
```

#### Promise.finally

Method: accept a callback - `( context? ) => any` - that is executed asynchronously when the promise is settled.

Its return value is a new promise that propagate the state of the original promise.

#### Promise.catch

Method: accept a callback - `(reason, context?) => R` - that is executed asynchronously when the promise rejects.

Its return value is a new promise that either:

+ propagate the state of the original promise,
+ reject with any exception that happened during the callback execution
+ propagate the state of whatever value was returned by the callback

#### Promise.then

Method: accept two **optional** callbacks that could be `undefined` or `null`:

+ onFulfilled - `(value, context?) => F` - that is executed asynchronously when the promise resolves
+ onRejected - `(reason, context?) => R` - that is executed asynchronously when the promise rejects

Its return value is a new promise that either:

+ propagate the state of the original promise, when no callback was given or were `undefined` or `null
+ reject with any exception that happened during either callback execution
+ propagate the state of whatever value was returned by the executed callback

#### Promise.context

Getter: resolves to a thenable (an object having a then method) which callbacks accept tuples instead:

+ onFulfilled - `(v: [ value, context? ]) => F` - that is executed asynchronously when the promise resolves
+ onRejected - `(r: [ reason, context? ]) => R` - that is executed asynchronously when the promise rejects

Its return value is a new promise that either:

+ propagate the state of the original promise, when no callback was given or were `undefined` or `null
+ reject with any exception that happened during either callback execution
+ propagate the state of whatever value was returned by the executed callback

> **NOTE:** This returned promise major added value is to help with the async/await writing style:
> ```typescript
> import { Promise as ContextPromise } from '@squall/context';
> import { TRANSACTION_TOKEN } from './somewhere'
> 
> async function runInTransationAfer(promise: ContextPromise) {
>   const [value, context] = await promise.context;
>   const transationId = context.has(TRANSACTION_TOKEN) ? context.inject(TRANSACTION_TOKEN)
>       : context.provide(TRANSACTION_TOKEN, /* start a new transaction and get its ID */).inject(TRANSACTION_TOKEN);
> 
>   // Do something with with value, reusing transaction when there is already an existsing one.
> }
> ```

#### Promise::allSettled

Static Method: `( iterableOrArrayOfValuesOrPromises, context? )` - return a promise that resolve
with an aggregate array of statuses, each with the context it was resolved with, or,
the context given to `allSettled` if the former is null-ish.

While the aggregate entries have their respective context, the returned promise will only have a promise it was
called with one.

#### Promise::resolve

Static Method: `( value, context? )` - return a promise that resolve with `value`, along with `context`, if given.

#### Promise::reject

Static Method: `( reason, context? )` - return a promise that reject with `reason`, along with `context`, if given.

#### Promise::race

Static Method: `( iterableOrArrayOfValuesOrPromises, context? )` - return a promise that settle with the state of the
first entry to settle, along with that settled context or the `context` given in parameter, if any.

#### Promise::all

Static Method: `( iterableOrArrayOfValuesOrPromises, context? )` - return a promise that resolve with and array of
values, along with `context` passed to this method, if given.

#### Promise::any

Static Method: `( iterableOrArrayOfValuesOrPromises, context? )` - return a promise that resolve with the first entry to
of resolved, along with `context` either of the resolved entry or this method call (if given). It otherwise rejects with
and `AggregateError` having reasons for all failures, or empty array if no entries were empty. 

## Contribution

```shell
git clone https://github.com/squall-io/context.git
cd context
```

```shell
# Install dependencies
yarn install
```

```shell
# yarn test + nodemon
yarn test:dev
```

### Guidelines

We follow best practices for Open-Source Software contributions, including:

+ Be respectful of peers inputs
+ If you say something, add value
+ Lint, test, be consistent before submitting a pull request (PR)
+ Document you code, even with commits and PR description for the dummies

> + Submit pull request at: https://github.com/squall-io/context/pulls
> + Open issues at (using labels for triage): https://github.com/squall-io/context/issues
> + Request features at(using labels for triage): https://github.com/squall-io/context/issues

### Contributors

+ [Salathiel Genese](https://salathiel.genese.name)

### Upcoming

+ [ ] Coming soon
+ [x] Work In Progress

Here is the plan:

+ [ ] Binding contexts to injected bean
+ [ ] Context.from(beanObject)
+ [ ] Conditional beans
+ [ ] Beans lifecycles events
+ [ ] Reactive beans: that create/update/delete based on context events
+ [ ] @Injectable on classes/constructors and instance methods (require @Bean to resolve parameters and Context.from())
+ [ ] @Bean(token, qualifier) for constructor- and method- parameters
+ [ ] @Inject(token, qualifier) for cases when/where constructor parameters cannot be easily overriden
+ [ ] @ContextProvider
+ [ ] Context discovery across code and dependencies
+ [ ] Beans metrics
+ [x] `Promise` integration
+ [ ] `RxJs` integration
