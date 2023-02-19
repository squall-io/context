@squall.io/context
===

Welcome to `@squall.io/context` library! This library was created to help developers quickly and easily propagate
context and handle synchronous and asynchronous operations in their applications.

It provides a set of tools to help manage application state and the associated context information. With this library,
developers can easily create and manage context objects that are associated with requests, responses, transactions, and
keep them consistently across the application.

Additionally, the library provides asynchronous capabilities to help make asynchronous operations easier to manage. With
`@squall.io/context`, developers can manage their application context and asynchronous operations with ease.

**Features:**

+ [x] Dependency container
+ [x] Dependency Injection
+ [x] Inheritable DI container (even multiple inheritance)
+ [x] Context propagation
+ [x] Asynchronous context propagation
+ [x] Context-aware promise implementation
+ [x] Async/Await API context propagation compatibility
+ [ ] Conditional beans
+ [ ] Bean and context lifecycle & hooks
+ [ ] Beans pre- and post-processors
+ [ ] Inversion of Control _(considered as a separate library responsibility)_

## Context

```typescript
import {Context} from "@squall.io/context";

const context = new Context() // Create a context 
    .provide('host', () => 'localhost') // Register a bean factory
    .provide('host', 'db', () => 'somewhere.cloud.google.com'); // Register a bean factory

// Inject the bean (the value is cached for later calls).
context.inject('host'); // "localhost" (default qualifier)
context.inject('host', 'db'); // "somewhere.cloud.google.com" ("db" qualifier)
```

> Token can be a symbol. Refer to the JS documentation and TypeScript hints to see supported usage.
>
> ```typescript
> // Context can inherit from one or more parent contexts.
> new Context(appContext, requestContext, transactionContext);
> ```
>
> Please, refer to the JS doc. for more detail on the expected behaviours and the other APIs available.

## Promise

```typescript
import {Context, Promise as ContextPromise} from "@squall.io/context";

const firstContext = new Context();
ContextPromise.resolve(1, firstContext)
    .then((value, context) => {
        // 1 === value
        // firstContext === context
    });

const secondContext = new Context();
ContextPromise.reject(-1, secondContext)
    .catch((reason, context) => {
        // -1 === value
        // secondContext === context
    });

const thridContext = new Context();
ContextPromise.reject(-2, thridContext)
    .finally(context => {
        // thridContext === context
    });
```

> The context propagated through the async chain always follow the most recency precedence.
> ```typescript
> const context = new Context();
> ContextPromise.resolve(ContextPromise.resolve(1, context), new Context())
>   .then((value, ctx) => {
>     // 1 === value
>     // context === ctx
>   });
> ```
>
> Please, refer to the JS doc. for more detail on the expected behaviours and the other APIs available.

## Context Propagation

The sync. API:

```typescript
import {Context, Promise as ContextPromise} from "@squall.io/context";

let value: number = context.invoke(doSomethingWithinContext);

function doSomethingWithinContext(ctx: Context): number {
    // Can access `Context.invoked` once to get the context, in the same event loop the invoke method was called into
    Context.invoked === ctx;
    
    // removed for brievity
}
```

> Oh, you instead want to make a native promise into a context-aware one?
> ```typescript
> import {Context, Promise as ContextPromise} from "@squall.io/context";
> 
> ContextPromise.from((async () => 1)(), new Context());
> ```

The async. API (compatibility with async/await):

```typescript
import {Context, Promise as ContextPromise} from "@squall.io/context";

try {
    const [value, context] = await contextAwarePromise.context;
} catch (error) {
    const [reason, ctx] = error as any;
}
```

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

### Contributors

+ [Salathiel Genese](https://salathiel.genese.name)

**Contribution Guidelines**

We follow best practices for Open-Source Software contributions, including:

+ Be respectful of peers inputs
+ If you say something, add value
+ Lint, test, be consistent before submitting a pull request (PR)
+ Document you code, even with commits and PR description for the beginners

> + Submit pull request at: https://github.com/squall-io/context/pulls
> + Open issues at (using labels for triage): https://github.com/squall-io/context/issues
> + Request features at(using labels for triage): https://github.com/squall-io/context/issues
