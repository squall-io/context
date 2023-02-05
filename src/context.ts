import {Promise as ContextPromise} from ".";

export class Context {
    static readonly #DEFAULT_QUALIFIER = Symbol('DEFAULT_QUALIFIER');
    static readonly ERR_NO_BEAN_DEFINITION = 'NO_BEAN_DEFINITION';
    static readonly ERR_DUPLICATE_FACTORY = 'DUPLICATE_FACTORY';
    static readonly ERR_UNDECIDABLE_BEAN = 'UNDECIDABLE_BEAN';
    static readonly ERR_EMPTY_VALUE = 'EMPTY_VALUE';

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

    provide<T extends Context.Token<any>>(
        token: T, beanDefinition: Context.BeanDefinition<T>): this;
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
        value = SHOULD_VALIDATE ? Context.#validValue(value, token, qualifiers[0]!, this) : value;

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

    inject<T extends Context.Token<any>>(token: T): Context.Value<T>;
    inject<T extends Context.Token<any>>(token: T, qualifier: string): Context.Value<T>;
    inject<T extends Context.Token<any>>(token: T, injectOptions: Context.InjectOptions): Context.Value<T>;
    inject<T extends Context.Token<any>>(
        token: T, qualifierOrInjectOptions?: string | Context.InjectOptions): Context.Value<T> {
        const qualifier = ('string' === typeof qualifierOrInjectOptions
            ? qualifierOrInjectOptions : qualifierOrInjectOptions?.qualifier) ?? Context.#DEFAULT_QUALIFIER;
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
                token, qualifier, this);

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
        } else {
            const suffix = Context.#DEFAULT_QUALIFIER === qualifier
                ? '' : Context.#format(' Qualifier<{0}>', qualifier);
            throw Context.#error(Context.ERR_NO_BEAN_DEFINITION,
                'No bean definition for Token<{0}>{1}.', Context.#tokenToString(token), suffix);
        }
    }

    hasOwn(token: Context.Token<any>, qualifier?: string): boolean {
        return this.#hasOwn(token, qualifier ?? Context.#DEFAULT_QUALIFIER)
    }

    has(token: Context.Token<any>, qualifier?: string): boolean {
        return this.#has(token, qualifier ?? Context.#DEFAULT_QUALIFIER);
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

    static #validValue<T>(value: T, token: Context.Token<any>, qualifier: string | symbol, context: Context): T {
        if (this.#isEmpty(value)) {
            const suffix = Context.#DEFAULT_QUALIFIER === qualifier
                ? '' : Context.#format(' Qualifier<{0}>', qualifier);
            throw this.#error(Context.ERR_EMPTY_VALUE,
                'Empty value ({0}) resolved for Token<{1}>{2}.',
                value, Context.#tokenToString(token), suffix);
        }

        if (this.#isThenable(value)) {
            return new ContextPromise((resolve, reject) => value
                .then(value => resolve(this.#validValue(value, token, qualifier, context), context),
                    reason => reject(reason, context))
                .then(null, reason => reject(reason, context))
            ) as T;
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

    export type InjectOptions = {
        forceEvaluation?: boolean;
        qualifier?: string;
    };

    export interface Configuration {
        factory: {
            lazyFunctionEvaluation: boolean;
            lazyValidation: boolean;
        };
    }

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
