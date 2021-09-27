export class Context {
    static readonly FACTORY_FAILURE = 'FACTORY_FAILURE';
    static readonly UNKNOWN_TOKENS = 'UNKNOWN_TOKENS';

    private readonly _error = (error: Error, name: string) => Object.assign(error, { name }) as Error;
    private readonly _factories = new Map<Context.Key, (context: Context) => any>();
    private readonly _dependencies = new Map<Context.Key, any>();

    provide<KA extends readonly Context.Key[]>(tokens: KA, ...factories: Context.Factories<KA>): this {
        for (let i = 0, l = tokens.length; i < l; i++) {
            if (null === factories[i] && 'function' === typeof tokens[i]) {
                this._factories.set(tokens[i]!, () => Reflect.construct(tokens[i]! as any, [this]));
                continue;
            }

            this._factories.set(tokens[i]!, factories[i]!);
        }

        return this;
    }

    async inject<KA extends readonly Context.Key[]>(...tokens: KA): Promise<Context.UnboxedKeys<KA>> {
        const unknownTokens = tokens.filter(token => !this._factories.has(token));

        if (unknownTokens.length) {
            throw this._error(new Error(`Unknown tokens (${unknownTokens.length}): ${unknownTokens}`), Context.UNKNOWN_TOKENS);
        }

        let outcome: any;
        const outcomes: any[] = [];

        for (const token of tokens) {
            if (this._dependencies.has(token)) {
                outcomes.push(this._dependencies.get(token));
            } else {
                outcome = this._factories.get(token)?.(this);

                if (outcome instanceof Promise) {
                    try {
                        outcome = await outcome;
                    } catch (suppressed) {
                        const error = new Error(`Factory failure for key "${token as any}"`);
                        throw Object.assign(this._error(error, Context.FACTORY_FAILURE), { suppressed });
                    }
                } else {
                    outcomes.push(outcome);
                }

                this._dependencies.set(token, outcome);
            }
        }

        return outcomes as any;
    }
}

export namespace Context {
    export type Key<T = any> = Token<T> | Constructor<T>;

    export type Token<T = any> = symbol & Record<never, T>;

    export type Constructor<T = any, D extends any[] = any[]> = {
        new(...dependencies: D): T;
    };

    export type UnboxedKey<K> = K extends Key<infer V> ? V : K;

    export type UnboxedKeys<KA extends readonly Context.Key[]> = {
        readonly [K in keyof KA]: UnboxedKey<KA[K]>;
    };

    export type UnboxedPromise<P> = P extends Promise<infer V> ? V : P;

    export type Factories<KA extends readonly Context.Key[]> = {
        readonly [K in keyof KA]: KA[K] extends Token<infer I> ? Factory<I>
        : KA[K] extends Constructor<infer I, [Context]> ? null | Factory<I>
        : KA[K] extends Constructor<infer I> ? Factory<I>
        : never;
    };

    export type Factory<I = any> = (context: Context) => Context.UnboxedPromise<I> | Promise<Context.UnboxedPromise<I>>;
}
