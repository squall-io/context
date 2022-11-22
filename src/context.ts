export class Context {
    static readonly #DEFAULT_QUALIFIER = Symbol('DEFAULT_QUALIFIER');
    static readonly ERR_MISSING_TOKEN_QUALIFIER = 'MISSING_TOKEN_QUALIFIER';
    static readonly ERR_DUPLICATE_FACTORY = 'DUPLICATE_FACTORY';
    static readonly ERR_EMPTY_VALUE = 'EMPTY_VALUE';

    readonly #dependencies = new Context.FlexibleMap<Context.Token<any>, Context.FlexibleMap<string | symbol, any>>();
    readonly #factories = new Context.FlexibleMap<Context.Token<any>,
        Context.FlexibleMap<string | symbol, { (context: Context): unknown }>>();
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
                configurationOrParent.factory?.lazyValidation ?? false
            this.#configuration.factory.lazyFunctionEvaluation =
                configurationOrParent.factory?.lazyFunctionEvaluation ?? false
        }
    }

    provide<T extends Context.Token<any>>(...provider: [
        token: T, ...qualifiers: string[], valueOrFactory: Context.ValueOrFactory<T>]): this {
        const valueOrFactory = provider.pop() as Context.ValueOrFactory<T>;
        const qualifiers = provider as (string | symbol)[] ?? [];
        const token = provider.shift() as T;

        if (0 === qualifiers.length) {
            qualifiers.push(Context.#DEFAULT_QUALIFIER);
        }

        for (const qualifier of qualifiers) {
            if (this.#hasOwn(token, qualifier)) {
                throw new Error(Context.#format('{0}: Token<{1}> + Qualifier<{2}> duplicate factory found.',
                    Context.ERR_DUPLICATE_FACTORY, Context.#tokenToString(token), Context.#tokenToString(qualifier)))
            }
        }

        let [factory, value] = [
            'function' === typeof valueOrFactory ? valueOrFactory as { (context: Context): unknown } : undefined,
            'function' === typeof valueOrFactory ? undefined : valueOrFactory as unknown];

        if (factory && !this.#configuration.factory.lazyFunctionEvaluation) {
            value = factory(this);
        }

        if (Context.#isThenable(value)) {
            value = value.then(value => {
                if (Context.#isEmpty(value)) {
                    throw new Error(Context.#format(
                        '{0}: Token<{1}>/Qualifiers<{2}> resolved to an empty <{3}>.',
                        Context.ERR_EMPTY_VALUE,
                        Context.#tokenToString(token),
                        qualifiers.map(qualifier => Context.#tokenToString(qualifier)).join(', '),
                        value));
                }
            });
        }

        if (!this.#configuration.factory.lazyValidation && (factory // In case of eager validation, Is it a factory?
            ? !this.#configuration.factory.lazyFunctionEvaluation    //  [YES] - Then, is it lazily evaluated?
                ? false                                             //      [YES] => No need validating the value
                : Context.#isEmpty(value)                              //      [ NO] => Validate value
            : Context.#isEmpty(value))) {                              //  [ NO] - Validate value
            throw new Error(Context.#format('{0}: Token<{1}>/Qualifiers<{2}> resolved to an empty <{3}>.',
                Context.ERR_EMPTY_VALUE, Context.#tokenToString(token),
                qualifiers.map(qualifier => Context.#tokenToString(qualifier)).join(', '),
                value));
        }

        if (factory) {
            for (const qualifier of qualifiers) {
                this.#factories
                    .computeIfNotExists(token, () => new Context.FlexibleMap())
                    ?.set(qualifier, factory);
            }
        }

        if (value) {
            for (const qualifier of qualifiers) {
                this.#dependencies
                    .computeIfNotExists(token, () => new Context.FlexibleMap())
                    ?.set(qualifier, value);
            }
        }

        return this;
    }

    inject<T extends Context.Token<any>>(token: T, qualifier?: string): Context.Value<T>;
    inject<T extends Context.Token<any>>(token: T, injectOptions?: Context.InjectOptions): Context.Value<T>;
    inject<T extends Context.Token<any>>(token: T, qualifierOrInjectOptions?: string | Context.InjectOptions): Context.Value<T> {
        const qualifier = ('string' === typeof qualifierOrInjectOptions
            ? qualifierOrInjectOptions : qualifierOrInjectOptions?.qualifier) ?? Context.#DEFAULT_QUALIFIER;
        const forceEvaluation = 'string' === typeof qualifierOrInjectOptions
            ? false : !!qualifierOrInjectOptions?.forceEvaluation;
        const value = this.#resolve(token, qualifier, forceEvaluation);

        if (Context.#isEmpty(value)) {
            throw new Error(Context.#format('{0}: No candidates found for Token<{1}>/Qualifier<{2}>.',
                Context.ERR_MISSING_TOKEN_QUALIFIER, Context.#tokenToString(token), Context.#tokenToString(qualifier)));
        }

        return value;
    }

    hasOwn(token: Context.Token<any>, qualifier?: string): boolean {
        return this.#hasOwn(token, qualifier ?? Context.#DEFAULT_QUALIFIER)
    }

    has(token: Context.Token<any>, qualifier?: string): boolean {
        return this.#has(token, qualifier ?? Context.#DEFAULT_QUALIFIER);
    }

    #resolve<T extends Context.Token<any>>(token: T, qualifier: string | symbol, forceEvaluation: boolean): Context.Value<T> {
        let value = forceEvaluation ? undefined : this.#dependencies.get(token)?.get(qualifier);

        if (Context.#isEmpty(value)) {
            value = this.#factories.get(token)?.get(qualifier)?.(this);

            if (Context.#isEmpty(value)) {
                throw new Error(Context.#format('{0}: Token<{1}> + Qualifier<{2}> resolved to an empty <{3}>.',
                    Context.ERR_EMPTY_VALUE, Context.#tokenToString(token), Context.#tokenToString(qualifier), value));
            } else if (Context.#isThenable(value)) {
                value = value.then(value => {
                    if (Context.#isEmpty(value)) {
                        throw new Error(Context.#format(
                            '{0}: Token<{1}> + Qualifier<{2}> resolved to an empty <{3}>.',
                            Context.ERR_EMPTY_VALUE, Context.#tokenToString(token),
                            Context.#tokenToString(qualifier), value));
                    }
                });
            }

            if (Context.#isEmpty(value)) {
                for (const parent of this.#parents.reverse()) {
                    if (!Context.#isEmpty(value = parent.#resolve(token, qualifier, forceEvaluation))) {
                        return value;
                    }
                }
            } else {
                this.#dependencies
                    .computeIfNotExists(token, () => new Context.FlexibleMap())
                    ?.set(qualifier, value);
            }
        }

        return value;
    }

    #hasOwn(token: Context.Token<any>, qualifier?: string | symbol): boolean {
        return (this.#dependencies.has(token) && (!qualifier || this.#dependencies.get(token)!.has(qualifier))) ||
            (this.#factories.has(token) && (!qualifier || this.#factories.get(token)!.has(qualifier)));
    }

    #has(token: Context.Token<any>, qualifier?: string | symbol): boolean {
        return this.#hasOwn(token, qualifier) ||
            this.#parents.some(parent => parent.#has(token, qualifier));
    }

    static #format(template: string, ...values: any[]): string {
        const PLACEHOLDERS = [...template.matchAll(/\{(0|[1-9]\d*)}/g)];

        return template.split(/\{(?:0|[1-9]\d*)}/g)
            .map((chunk, i) => [chunk, PLACEHOLDERS[i]?.[1]])
            .map(([chunk, index]) => chunk + (index ? values[+index] : ''))
            .join('')
    }

    static #isThenable(value: any): value is Promise<unknown> {
        return 'object' === typeof value && 'then' in value &&
            'function' === typeof value['then'];
    }

    static #tokenToString(token: Context.Token<any>): string {
        return 'symbol' === typeof token
            ? `Symbol(${token.description})`
            : 'function' === typeof token
                ? `class ${token.name}`
                : token;
    }

    static #isEmpty(value: any): value is null | undefined {
        return null === value || undefined === value;
    }
}

export namespace Context {
    export type ValueOrFactory<T extends Token<any>> = T extends TokenSymbol<infer I> ? I | { (context: Context): I }
        : T extends Constructor<infer I> ? I | { (context: Context): I }
            : { (context: Context): unknown }; // NOTE: (unknown | whatever) results in unknown
    export type Value<T extends Token<any>> = T extends TokenSymbol<infer I> ? I
        : T extends Constructor<infer I> ? I
            : unknown;
    export type Token<T> = string | TokenSymbol<T> | Constructor<T>;
    export type Constructor<T> = { new(...parameters: any[]): T };
    export type TokenSymbol<T> = symbol & Record<never, T>;
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
