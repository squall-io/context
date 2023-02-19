import {Promise as ContextPromise} from ".";

/**
 * @name Context
 * @description Container for dependency injection (DI) and utility for context propagation.
 * But let us establish some definitions and concepts at first:
 *
 * + **Token**: The key (often primary key) that is used to retrieve a value from the dependency container.
 * + **Qualifier**: Beans are identified with a token. But variant(s) or specializations of the same beans can be tagged
 *   with a qualifier. But a qualifier is optional.
 * + **Default Qualifier**: When providing beans definition to a context, it denotes the absence of qualifier beside the
 *   token. And, when injecting a bean, it denotes either the absense of qualifier or that there is actually a single
 *   candidate bean from that token. _(This implementation do not expose the developers with default qualifiers.)_
 * + **Context Level**: A context is somewhat related to the programming idea of scope. As such, contexts are
 *   hierarchical. And a context level is just a node in the three of context.
 *   > This implementation is opinionated for multi-parents' context-level, with the latter parent having precedence
 *   > over the former, when we have to traverse the ancestor tree.
 * + **Bean Definition**: The value or a function that will be used to resolve a bean. This definition sometimes
 *   encompasses the token, its qualifiers when given and, sometimes, other associated metadata.
 * + **Empty**: Strictly equals to `null` or `undefined`.
 *
 * @see provide
 * @see inject
 * @see hasOwn
 * @see has
 * @see invoke
 * @see invoked
 */
export class Context {
    static readonly #DEFAULT_QUALIFIER = Symbol('DEFAULT_QUALIFIER');
    static readonly ERR_NO_BEAN_DEFINITION = 'NO_BEAN_DEFINITION';
    static readonly ERR_DUPLICATE_FACTORY = 'DUPLICATE_FACTORY';
    static readonly ERR_UNDECIDABLE_BEAN = 'UNDECIDABLE_BEAN';
    static readonly ERR_EMPTY_VALUE = 'EMPTY_VALUE';

    static #invoked?: Context | undefined;

    readonly #dependencies = new Context.FlexibleMap<Context.Token<any>, Context.FlexibleMap<string | symbol, any>>();
    readonly #factories = new Context.FlexibleMap<Context.Token<any>,
        Context.FlexibleMap<string | symbol, Context.Factory<unknown>>>();
    readonly #configuration: Context.Configuration = {
        factory: {
            lazyFunctionEvaluation: false,
            lazyValidation: false,
        }
    };
    readonly #parents: Context[] = [];

    /**
     * @constructor
     * @description Create a context inheriting from none or more parents;
     *
     * @param parents A list of context to use as ancestors (fallbacks) of the context being created.
     */
    constructor(...parents: Context[]);
    /**
     * @constructor
     * @description Create a context, eventually overriding its default configuration, inheriting from none or more
     * parents.
     *
     * @param configuration A deeply-partial configuration, to customize default behaviour.
     * @param parents A list of context to use as ancestors (fallbacks) of the context being created.
     */
    constructor(configuration: Context.DeepPartial<Context.Configuration>, ...parents: Context[]);
    constructor(configurationOrParent?: Context | Context.DeepPartial<Context.Configuration>, ...parents: Context[]) {
        if (configurationOrParent instanceof Context) {
            this.#parents.push(configurationOrParent, ...parents);
        } else if (configurationOrParent) {
            this.#parents.push(...parents);
            this.#configuration.factory.lazyValidation =
                configurationOrParent.factory?.lazyValidation ?? false;
            this.#configuration.factory.lazyFunctionEvaluation =
                configurationOrParent.factory?.lazyFunctionEvaluation ?? false;
        }
    }

    /**
     * @description Return the current context of code execution, if any.
     * @see invoke
     */
    static get invoked(): Context | undefined {
        const invoked = Context.#invoked;
        Context.#invoked = undefined;
        return invoked;
    }

    /**
     * @description Provide a bean definition mapped to a `token`, using the default qualifier.
     *
     * @param token The token to map the given `beanDefinition` to
     * @param beanDefinition A value (bean) or a function to create the bean
     *
     * @returns The context on which the `provide` method was called on.
     *
     * @throws (A) `Error` where `error.name === Context.ERR_DUPLICATE_FACTORY`, when a bean definition with the given
     *         `token` already exists in this context, under the default qualifier.
     * @throws (B) `Error` where `error.name === Context.ERR_EMPTY_VALUE` when a bean definition resolves to an empty
     *         value and context's configuration `factory.lazyValidation` is `false`.
     *         > **NOTE:** If this context is configured with `factory.lazyValidation` to `false`, this error is:
     *         > + thrown if the resolved bean is empty;
     *         > + not thrown if the resolved bean is a `Promise`;
     *         > + not thrown if this context is configured with `factory.lazyFunctionEvaluation` to `true`.
     *
     * @see inject
     * @see provide
     */
    provide<T extends Context.Token<any>>(
        token: T, beanDefinition: Context.BeanDefinition<T>): this;
    /**
     * @description Provide a bean definition mapped to a `token`, using the given qualifier/s.
     *
     * @param token The token to map the given `beanDefinition` to
     * @param qualifiers One or more qualifiers under which to specify the given `beanDefinition`
     * @param beanDefinition A value (bean) or a function to create the bean
     *
     * @returns The context on which the `provide` method was called on.
     *
     * @throws (A) `Error` where `error.name === Context.ERR_DUPLICATE_FACTORY`, when a bean definition with the given
     *         `token` and any of the given `qualifiers` already exists in this context.
     * @throws (B) `Error` where `error.name === Context.ERR_EMPTY_VALUE` when a bean definition resolves to an empty
     *         value and context's configuration `factory.lazyValidation` is `false`.
     *         > **NOTE:** If this context is configured with `factory.lazyValidation` to `false`, this error is:
     *         > + thrown if the resolved bean is empty;
     *         > + not thrown if the resolved bean is a `Promise`;
     *         > + not thrown if this context is configured with `factory.lazyFunctionEvaluation` to `true`.
     *
     * @see inject
     * @see provide
     */
    provide<T extends Context.Token<any>>(
        token: T, qualifiers: string | string[], beanDefinition: Context.BeanDefinition<T>): this;
    provide<T extends Context.Token<any>>(
        token: T, theQualifiers: string | string[] | Context.BeanDefinition<T>,
        beanDefinition?: Context.BeanDefinition<T>): this {
        const qualifiers: (string | symbol)[] = 2 === arguments.length
            ? [Context.#DEFAULT_QUALIFIER]
            : Array.isArray(theQualifiers)
                ? 0 === theQualifiers.length
                    ? [Context.#DEFAULT_QUALIFIER]
                    : theQualifiers
                : [theQualifiers];
        beanDefinition = 2 === arguments.length
            ? theQualifiers as Context.BeanDefinition<T>
            : beanDefinition;

        for (const qualifier of qualifiers) {
            if (this.#hasOwn(token, qualifier)) {
                const suffix = Context.#DEFAULT_QUALIFIER === qualifier
                    ? '' : Context.#format(' Qualifier<{0}>', qualifier);
                throw Context.#error(Context.ERR_DUPLICATE_FACTORY,
                    'Duplicate bean definition for Token<{0}>{1}.', Context.#tokenToString(token), suffix);
            }
        }

        let [factory, value] = [
            'function' === typeof beanDefinition ? beanDefinition as Context.Factory<unknown> : undefined,
            'function' === typeof beanDefinition ? undefined : beanDefinition as unknown];

        const IS_EAGER_FACTORY_EVALUATION = !this.#configuration.factory.lazyFunctionEvaluation;

        if (factory && IS_EAGER_FACTORY_EVALUATION) {
            value = factory(this, token, ...Context.#DEFAULT_QUALIFIER === qualifiers[0] ? [] : qualifiers as string[]);
        }

        const IS_EAGER_VALIDATION = !this.#configuration.factory.lazyValidation;
        const SHOULD_VALIDATE = Context.#isThenable(value)
            || (IS_EAGER_VALIDATION && (!factory || IS_EAGER_FACTORY_EVALUATION));
        value = SHOULD_VALIDATE ? Context.#validValue(value, token, qualifiers[0]!, INJECT_NO_DEFAULT, this) : value;

        if (factory) {
            for (const qualifier of qualifiers) {
                this.#factories
                    .computeIfNotExists(token, () => new Context.FlexibleMap())
                    ?.set(qualifier, factory);
            }
        }

        if (!Context.#isEmpty(value)) {
            for (const qualifier of qualifiers) {
                this.#dependencies
                    .computeIfNotExists(token, () => new Context.FlexibleMap())
                    ?.set(qualifier, value);
            }
        }

        return this;
    }

    /**
     * @description Retrieve a bean from dependency injection container using the default qualifier algorithm.
     *              The algorithm is as follows:
     *
     * + First lookup the bean from internal cache
     * + If not found, lookup the bean definition on the context this method was called on. If bean definition exists,
     *   resolve the bean from it, update the internal cache and return the bean
     * + If not found still, travel the parent contexts in reverse order, using a depth-first algorithm, and follow the
     *   previous algorithm
     * + If still the bean cannot be resolved, throw an error.
     *
     * @param token The token to retrieve the associated bean from, using default qualifier
     *
     * @returns The resolved bean. Note that when the resolved bean is a thenable, it gets wrapped into a context-aware
     *          promise.
     *
     * @throws (A) `Error` where `error.name === Context.ERR_UNDECIDABLE_BEAN` when both the following are true:
     *         (A.1) there is no bean definition mapped under default qualifier;
     *         (A.2) there are multiple qualified candidates under the given `token`.
     * @throws (B) `Error` where `error.name === Context.ERR_NO_BEAN_DEFINITION` when no bean definition is found for
     *          the given `token`.
     * @throws (C) `Error` where `error.name === Context.ERR_EMPTY_VALUE` when the resolved bean is empty.
     *
     * @see inject
     * @see provide
     */
    inject<T extends Context.Token<any>>(token: T): Context.Value<T>;
    /**
     * @description Retrieve a bean from dependency injection container using token and qualifier algorithm.
     *              The algorithm is as follows:
     *
     * + First lookup the bean from internal cache
     * + If not found, lookup the bean definition on the context this method was called on. If bean definition exists,
     *   resolve the bean from it, update the internal cache and return the bean
     * + If not found still, travel the parent contexts in reverse order, using a depth-first algorithm, and follow the
     *   previous algorithm
     * + If still the bean cannot be resolved, throw an error.
     *
     * @param token The token to retrieve the associated bean from, using default qualifier
     * @param qualifier The qualifier, to select a specialization
     *
     * @returns The resolved bean. Note that when the resolved bean is a thenable, it gets wrapped into a context-aware
     *          promise.
     *
     * @throws (A) `Error` where `error.name === Context.ERR_UNDECIDABLE_BEAN` when both the following are true:
     *         (A.1) there is no bean definition mapped under default qualifier;
     *         (A.2) there are multiple qualified candidates under the given `token`.
     * @throws (B) `Error` where `error.name === Context.ERR_NO_BEAN_DEFINITION` when no bean definition is found for
     *          the given `token` and `qualifier`.
     * @throws (C) `Error` where `error.name === Context.ERR_EMPTY_VALUE` when the resolved bean is empty.
     *
     * @see inject
     * @see provide
     */
    inject<T extends Context.Token<any>>(token: T, qualifier: string): Context.Value<T>;
    /**
     * A variation of the other two overloads with more options, and more inline flexibility.
     *
     * @param token The token to retrieve the associated bean from, using default qualifier
     * @param injectOptions Injection options
     *
     * @return Refer to the other overloads.
     *
     * @throws Refer to the more relatable overload.
     *
     * @see inject
     * @see provide
     */
    inject<T extends Context.Token<any>, D = never>(
        token: T, injectOptions: Context.InjectOptions<D>): Context.Value<T> | D;
    inject<T extends Context.Token<any>, D = never>(
        token: T, qualifierOrInjectOptions?: string | Context.InjectOptions<D>): Context.Value<T> | D {
        const qualifier = ('string' === typeof qualifierOrInjectOptions
            ? qualifierOrInjectOptions : qualifierOrInjectOptions?.qualifier) ?? Context.#DEFAULT_QUALIFIER;
        const defaultInjection = 'string' === typeof qualifierOrInjectOptions
            ? INJECT_NO_DEFAULT : qualifierOrInjectOptions && 'default' in qualifierOrInjectOptions
                ? qualifierOrInjectOptions.default : INJECT_NO_DEFAULT;
        const forceEvaluation = 'string' === typeof qualifierOrInjectOptions
            ? false : qualifierOrInjectOptions?.forceEvaluation;
        const resolvedBeanDefinition = this.#resolveBeanDefinition(token, qualifier);

        if (resolvedBeanDefinition) {
            const [context, definition, isUndecidable = false] = resolvedBeanDefinition;

            if (isUndecidable) {
                // NOTE: Context.#DEFAULT_QUALIFIER is implied
                throw Context.#error(Context.ERR_UNDECIDABLE_BEAN,
                    'Undecidable bean for Token<{0}>.', Context.#tokenToString(token));
            }

            const value: Context.Value<T> = Context.#validValue(
                forceEvaluation ? 'factory' in definition
                        ? definition.factory?.(context, token,
                            ...Context.#DEFAULT_QUALIFIER === qualifier ? [] : [qualifier])
                        : (definition as any)['value']
                    : 'value' in definition
                        ? (definition as any)['value']
                        : (definition as any)['factory']?.(context, token,
                            ...Context.#DEFAULT_QUALIFIER === qualifier ? [] : [qualifier]),
                token, qualifier, defaultInjection, this);

            if (!('value' in definition)) {
                this.#dependencies
                    .computeIfNotExists(token, () => new Context.FlexibleMap())
                    ?.set(qualifier, value)
            }

            return value;
        } else if ('function' === typeof token && 0 === token.length) {
            const value = Reflect.construct(token, []);

            this.#dependencies
                .computeIfNotExists(token, () => new Context.FlexibleMap())
                ?.set(qualifier, value);

            return value;
        } else if (INJECT_NO_DEFAULT !== defaultInjection) {
            return defaultInjection;
        } else {
            const suffix = Context.#DEFAULT_QUALIFIER === qualifier
                ? '' : Context.#format(' Qualifier<{0}>', qualifier);
            throw Context.#error(Context.ERR_NO_BEAN_DEFINITION,
                'No bean definition for Token<{0}>{1}.', Context.#tokenToString(token), suffix);
        }
    }

    /**
     * @description Returns a boolean indicating whether this context itself has a bean definition under the given
     *              parameters. Note that when no qualifier is given, the algorithm follows with the default qualifier
     *              specification.
     *
     * @param token The token to look up the associated bean from
     * @param qualifier [Optional] - The qualifier to specialize token lookup
     *
     * @returns `true` if there is a bean definition associated to the given token and eventually, qualifier. `false`
     *          otherwise.
     *
     * @see has
     */
    hasOwn(token: Context.Token<any>, qualifier?: string): boolean {
        return this.#hasOwn(token, qualifier ?? Context.#DEFAULT_QUALIFIER)
    }

    /**
     * @description Returns a boolean indicating whether this context itself has a bean definition under the given
     *              parameters. Note that when no qualifier is given, the algorithm follows with the default qualifier
     *              specification.
     *
     * @description When not found in this context, it travels the parent contexts in reverse order, using a depth-first
     *              algorithm.
     *
     * @param token The token to look up the associated bean from
     * @param qualifier [Optional] - The qualifier to specialize token lookup
     *
     * @returns `true` if there is a bean definition associated to the given token and eventually, qualifier. `false`
     *          otherwise.
     *
     * @see hasOwn
     */
    has(token: Context.Token<any>, qualifier?: string): boolean {
        return this.#has(token, qualifier ?? Context.#DEFAULT_QUALIFIER);
    }

    /**
     * @description Run code within context awareness.
     *
     * @description This context is set before the `fn` function execution. It is synchronously accessible using
     *              `Context.invoked` static getter. Subsequent calls return `undefined`. Regardless of that getter
     *              being called or not, the static context i synchronously set to `undefined` after `fn` function
     *              execution.
     *
     * @description This is most useful in synchronous code execution. For asynchronous context propagation, use
     *              context-aware promise implementation.
     *
     * @param fn A function to be executed.
     *
     * @returns Whatever value is returned by `fn` execution. If that returned value is a thenable, then it gets wrapped
     *          under a context-aware thenable implementation.
     *
     * @see invoked
     */
    invoke<R>(fn: (context: Context) => R): R extends PromiseLike<infer I> ? ContextPromise<I> : R {
        const returned = fn(Context.#invoked = this);
        Context.#invoked = undefined;

        if (Context.#isThenable(returned)) {
            return ContextPromise.from(returned) as any;
        } else {
            return returned as any;
        }
    }

    #resolveBeanDefinition(token: Context.Token<any>, qualifier: string | symbol): void |
        [ctx: Context, def: { value?: unknown, factory?: Context.Factory<unknown> }, isUndecidable?: boolean] {
        const dependencyByToken = this.#dependencies.get(token);
        const factoryByToken = this.#factories.get(token);
        const factory = factoryByToken?.has(qualifier)
            ? factoryByToken?.get(qualifier)
            : Context.#DEFAULT_QUALIFIER === qualifier && 1 === factoryByToken?.size
                ? factoryByToken.get([...factoryByToken.keys() as any][0])
                : undefined;

        if (dependencyByToken) {
            if (dependencyByToken.has(qualifier)) {
                return [this, {
                    value: dependencyByToken.get(qualifier),
                    ...factory ? {factory} : {}
                }];
            } else if (Context.#DEFAULT_QUALIFIER === qualifier) {
                if (1 === dependencyByToken.size) {
                    return [this, {
                        value: dependencyByToken.get([...dependencyByToken.keys() as any][0]),
                        ...factory ? {factory} : {}
                    }];
                } else if (1 < dependencyByToken.size) {
                    return [this, {}, true]; // Undecidable
                }
            }
        }

        if (factory) {
            return [this, {factory}];
        } else if (factoryByToken?.size && 1 < factoryByToken?.size) {
            return [this, {}, true]; // Undecidable
        }

        for (const parent of this.#parents.reverse()) {
            const resolvedBeanDefinition = parent.#resolveBeanDefinition(token, qualifier);

            if (resolvedBeanDefinition) {
                return resolvedBeanDefinition;
            }
        }
    }

    #hasOwn(token: Context.Token<any>, qualifier: string | symbol): boolean {
        if (this.#dependencies.has(token)) {
            const dependencies = this.#dependencies.get(token);

            if (Context.#DEFAULT_QUALIFIER === qualifier) {
                return dependencies?.has?.(qualifier) || 1 === dependencies?.size;
            } else {
                return !!dependencies?.has?.(qualifier);
            }
        } else if (this.#factories.has(token)) {
            const factories = this.#factories.get(token);

            if (Context.#DEFAULT_QUALIFIER === qualifier) {
                return factories?.has?.(qualifier) || 1 === factories?.size;
            } else {
                return !!factories?.has?.(qualifier);
            }
        }

        return false;
    }

    #has(token: Context.Token<any>, qualifier: string | symbol): boolean {
        return this.#hasOwn(token, qualifier) ||
            // NOTE: No need to reverse parent just for the check
            this.#parents.some(parent => parent.#has(token, qualifier));
    }

    static #validValue<T>(value: T, token: Context.Token<any>, qualifier: string | symbol,
                          defaultInjection: any, context: Context): T {
        if (this.#isEmpty(value)) {
            if (INJECT_NO_DEFAULT === defaultInjection) {
                const suffix = Context.#DEFAULT_QUALIFIER === qualifier
                    ? '' : Context.#format(' Qualifier<{0}>', qualifier);
                throw this.#error(Context.ERR_EMPTY_VALUE,
                    'Empty value ({0}) resolved for Token<{1}>{2}.',
                    value, Context.#tokenToString(token), suffix);
            } else {
                // NOTE: Break infinite loops - no validation nor transformation
                return defaultInjection;
            }
        }

        if (this.#isThenable(value)) {
            return new ContextPromise(async (resolve, reject) => {
                value.then((value, ctx = undefined) => {
                    const next = this.#validValue(
                        value, token, qualifier, defaultInjection, ctx ?? context);
                    resolve(next, ctx ?? context);
                }).then(null, (reason, ctx = undefined) => {
                    if (reason instanceof Error && Context.ERR_EMPTY_VALUE === reason.name && INJECT_NO_DEFAULT !== defaultInjection) {
                        resolve(defaultInjection, ctx ?? context);
                    } else {
                        reject(reason, ctx ?? context);
                    }
                });
            }, context) as T;
        }

        return value;
    }

    static #format(template: string, ...values: any[]): string {
        const PLACEHOLDERS = [...template.matchAll(/\{(0|[1-9]\d*)}/g)];

        return template.split(/\{(?:0|[1-9]\d*)}/g)
            .map((chunk, i) => [chunk, PLACEHOLDERS[i]?.[1]])
            .map(([chunk, index]) => chunk + (index ? values[+index] : ''))
            .join('')
    }

    static #isThenable(value: any): value is PromiseLike<unknown> {
        return value && 'object' === typeof value   // Is object but not null
            && 'then' in value                      // Has a 'then' property
            && 'function' === typeof value['then']; // That property maps to a function
    }

    static #tokenToString(token: Context.Token<any> | undefined): string {
        return 'symbol' === typeof token
            ? `Symbol(${token.description})`
            : 'function' === typeof token
                ? `class ${token.name}`
                : token || `JavaScript::${token}`;
    }

    static #isEmpty(value: any): value is null | undefined {
        return null === value || undefined === value;
    }

    static #error(name: string, template: string, ...values: any[]): Error {
        const error = new Error(this.#format(template, ...values))
        error.name = name;
        return error;
    }
}

export namespace Context {
    export type BeanDefinition<T extends Token<any>> = T extends TokenSymbol<infer I> ? I | Factory<I>
        : T extends Constructor<infer I> ? I | Factory<I>
            : T extends string ? Factory<unknown>
                : never;

    export type Value<T extends Token<any>> =
        T extends TokenSymbol<infer TS>
            ? TS extends PromiseLike<infer TS_PL>
                ? ContextPromise<TS_PL>
                : TS
            : T extends Constructor<infer T_C>
                ? T_C extends PromiseLike<infer T_C_PL>
                    ? ContextPromise<T_C_PL>
                    : T_C
                : T extends string
                    ? unknown
                    : never;

    export type Token<T> = string | TokenSymbol<T> | Constructor<T>;

    export type Constructor<T> = {
        new(...parameters: any[]): T
    };

    export type TokenSymbol<T> = symbol & Record<never, T>;

    export type Factory<T> = {
        (context: Context, token: Token<T>, ...qualifiers: string[]): T;
    };

    export type DeepPartial<T> = T extends (null | undefined | boolean | number | string) ? T : {
        [K in keyof T]?: DeepPartial<T[K]>;
    };

    export type InjectOptions<D = never> = {
        forceEvaluation?: boolean;
        qualifier?: string;
        default?: D;
    };

    export interface Configuration {
        factory: {
            lazyFunctionEvaluation: boolean;
            lazyValidation: boolean;
        };
    }

    export type Method<T> = {
        [K in keyof T]: K extends any ? T[K] extends ((...ars: any[]) => any) ? K : never : never;
    }[keyof T];

    export class FlexibleMap<K, V> extends Map<K, V> {
        computeIfNotExists(key: K, computer: { (key: K): V | undefined }): V | undefined | null {
            if (!this.has(key)) {
                const value = computer(key);

                if (undefined !== value && null !== value) {
                    this.set(key, value);
                }
            }

            return this.get(key);
        }
    }
}

const INJECT_NO_DEFAULT: any = Symbol('INJECT_NO_DEFAULT');
