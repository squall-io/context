export class Context {
    static readonly #DEFAULT_QUALIFIER = Symbol('DEFAULT_QUALIFIER');
    static readonly ERR_DUPLICATE_FACTORY = 'DUPLICATE_FACTORY';
    static readonly ERR_UNDECIDABLE_BEAN = 'UNDECIDABLE_BEAN';
    static readonly ERR_MISSING_TOKEN = 'MISSING_TOKEN';
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
                throw new Error(Context.#format(
                    '{0}: Duplicate bean definition for Token<{1}>{2}.',
                    Context.ERR_DUPLICATE_FACTORY, Context.#tokenToString(token),
                    Context.#DEFAULT_QUALIFIER === qualifier
                        ? '' : Context.#format(' Qualifier<{0}>', qualifier)));
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
                        Context.ERR_EMPTY_VALUE, Context.#tokenToString(token),
                        qualifiers.map(qualifier => Context.#tokenToString(qualifier)).join(', '), value));
                }
            });
        }

        if (!this.#configuration.factory.lazyValidation && (factory // In case of eager validation, Is it a factory?
            ? !this.#configuration.factory.lazyFunctionEvaluation   //  [YES] - Then, is it lazily evaluated?
                ? false                                             //      [YES] => No need validating the value
                : Context.#isEmpty(value)                           //      [ NO] => Validate value
            : Context.#isEmpty(value))) {                           //  [ NO] - Validate value
            throw new Error(Context.#format(
                '{0}: Token<{1}>/Qualifiers<{2}> resolved to an empty <{3}>.',
                Context.ERR_EMPTY_VALUE, Context.#tokenToString(token),
                qualifiers.map(qualifier => Context.#tokenToString(qualifier)).join(', '), value));
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

    inject<T extends Context.Token<any>>(token: T): Context.Value<T>; // TODO: Document undecidable bean error
    inject<T extends Context.Token<any>>(token: T, qualifier: string): Context.Value<T>;
    inject<T extends Context.Token<any>>(token: T, injectOptions?: Context.InjectOptions): Context.Value<T>;
    inject<T extends Context.Token<any>>(token: T, qualifierOrInjectOptions?: string | Context.InjectOptions): Context.Value<T> {
        const qualifier = ('string' === typeof qualifierOrInjectOptions
            ? qualifierOrInjectOptions : qualifierOrInjectOptions?.qualifier) ?? Context.#DEFAULT_QUALIFIER;
        const forceEvaluation = 'string' === typeof qualifierOrInjectOptions
            ? false : !!qualifierOrInjectOptions?.forceEvaluation;
        const undecided = new Set<string | symbol>();
        let context: Context | undefined = undefined;
        let value: unknown;

        if (forceEvaluation) {
            // TODO: Beside forcing factory evaluation (prototype bean),
            //       Should we allow caching the result, maybe by context on which is was called?
            const factoryWithContext = this.#resolveFactory(token, qualifier, undecided);

            [value] = Context.#validValue([
                factoryWithContext?.[0]?.(this),
                factoryWithContext?.[1]!
            ], token, qualifier) ?? [undefined, undefined];

            if (Context.#isEmpty(value)) {
                [value] = this.#resolveValue(token, qualifier, undecided) ?? [undefined, undefined];
            }
        } else {
            [value, context] = this.#resolveValue(token, qualifier, undecided) ?? [undefined, undefined];

            if (Context.#isEmpty(value)) {
                const factoryWithContext = this.#resolveFactory(token, qualifier, undecided);

                [value, context] = Context.#validValue([
                    factoryWithContext?.[0]?.(this),
                    factoryWithContext?.[1]!
                ], token, qualifier) ?? [undefined, undefined];

                if (!Context.#isEmpty(value)) {
                    context!.#dependencies
                        .computeIfNotExists(token, () => new Context.FlexibleMap())
                        ?.set(qualifier, value)
                }
            }
        }

        if (0 < undecided.size) {
            // NOTE: Context.#DEFAULT_QUALIFIER is implied: see how the set if filled in
            throw new Error(Context.#format(
                '{0}: Undecidable bean for Token<{1}>.',
                Context.ERR_UNDECIDABLE_BEAN, Context.#tokenToString(token)));
        } else if (Context.#isEmpty(value)) {
            if (Context.#DEFAULT_QUALIFIER == qualifier) {
                throw new Error(Context.#format(
                    '{0}: No bean nor bean-factory provided for Token<{1}>.',
                    Context.ERR_MISSING_TOKEN, Context.#tokenToString(token)));
            } else {
                throw new Error(Context.#format(
                    '{0}: No bean nor bean-factory provided for Token<{1}> Qualifier<{2}>.',
                    Context.ERR_MISSING_TOKEN, Context.#tokenToString(token), qualifier));
            }
        }

        return value as Context.Value<T>;
    }

    hasOwn(token: Context.Token<any>, qualifier?: string): boolean {
        return this.#hasOwn(token, qualifier ?? Context.#DEFAULT_QUALIFIER)
    }

    has(token: Context.Token<any>, qualifier?: string): boolean {
        return this.#has(token, qualifier ?? Context.#DEFAULT_QUALIFIER);
    }

    #resolveFactory(token: Context.Token<any>, qualifier: string | symbol,
                    undecided = new Set<string | symbol>()
    ): [factory: { (context: Context): unknown } | undefined, context: Context] | void {
        const factories = this.#factories.get(token);

        if (factories) {
            if (factories.has(qualifier)) {
                return [factories.get(qualifier), this];
            } else if (Context.#DEFAULT_QUALIFIER === qualifier) {
                if (1 == factories.size) {
                    return [factories.get([...factories.keys()][0] as string | symbol), this];
                } else if (0 < factories.size) {
                    for (let key of factories.keys()) {
                        undecided.add(key);
                    }
                }
            }
        }

        for (const parent of this.#parents.reverse()) {
            const factoryWithContext = parent.#resolveFactory(token, qualifier, undecided);

            if (factoryWithContext?.[0]) return factoryWithContext;
        }
    }

    #resolveValue(token: Context.Token<any>, qualifier: string | symbol,
                  undecided = new Set<string | symbol>()
    ): [value: unknown, context: Context] | void {
        const dependencies = this.#dependencies.get(token);

        if (dependencies) {
            if (dependencies.has(qualifier)) {
                // const value = Context.#validValue(dependencies.get(qualifier), token, Context.#DEFAULT_QUALIFIER);
                // return [value, this];

                return [dependencies.get(qualifier), this];
            } else if (Context.#DEFAULT_QUALIFIER === qualifier) {
                if (1 == dependencies.size) {
                    // const value = Context.#validValue(
                    //     dependencies.get([...dependencies.keys()][0] as string | symbol), token, qualifier);
                    // return [value, this];

                    return [dependencies.get([...dependencies.keys()][0] as string | symbol), this];
                } else if (0 < dependencies.size) {
                    for (let key of dependencies.keys()) {
                        undecided.add(key);
                    }
                }
            }
        }

        for (const parent of this.#parents.reverse()) {
            const valueWithContext = parent.#resolveValue(token, qualifier, undecided);

            if (valueWithContext?.[0]) return valueWithContext;
        }

        return;
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

    static #validValue<V>(valueWithContext: [V, Context] | void,
                          token: Context.Token<any>, qualifier: string | symbol): [V, Context] | void {
        if (this.#isEmpty(valueWithContext?.[0])) {
            if (!valueWithContext?.[1]) {
                throw new Error(Context.#format(
                    '{0}: Empty value ({1}) resolved for Token<{2}>{3}.',
                    Context.ERR_MISSING_TOKEN, valueWithContext?.[0], Context.#tokenToString(token),
                    Context.#DEFAULT_QUALIFIER === qualifier
                        ? '' : Context.#format(' Qualifier<{0}>', qualifier)));
            } else if (Context.#DEFAULT_QUALIFIER === qualifier) {
                throw new Error(Context.#format(
                    '{0}: Empty value ({1}) resolved for Token<{2}>.',
                    Context.ERR_EMPTY_VALUE, valueWithContext?.[0], Context.#tokenToString(token)));
            } else {
                throw new Error(Context.#format(
                    '{0}: Empty value ({1}) resolved for Token<{2}> Qualifier<{3}>.',
                    Context.ERR_EMPTY_VALUE, valueWithContext?.[0], Context.#tokenToString(token), qualifier));
            }
        } else if (this.#isThenable(valueWithContext?.[0])) {
            const thenable = valueWithContext?.[0]
                .then?.(target => this.#validValue([target, valueWithContext?.[1]], token, qualifier)?.[0]);

            return [thenable as V, valueWithContext?.[1]!];
        }

        return valueWithContext;
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
