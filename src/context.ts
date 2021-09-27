export class Context {
    static readonly FACTORY_FAILURE = 'FACTORY_FAILURE';
    static readonly UNKNOWN_KEYS = 'UNKNOWN_KEYS';

    private readonly _error = (error: Error, name: string) => Object.assign(error, { name }) as Error;
    private readonly _factories = new Map<Context.Key, (context: Context) => any>();
    private readonly _dependencies = new Map<Context.Key, any>();

    provide<KA extends readonly Context.Key[]>(keys: KA, ...factories: Context.Factories<KA>): this {
        for (let i = 0, l = keys.length; i < l; i++) {
            if (null === factories[i] && 'function' === typeof keys[i]) {
                this._factories.set(keys[i]!, () => Reflect.construct(keys[i]! as any, [this]));
                continue;
            }

            this._factories.set(keys[i]!, factories[i]!);
        }

        return this;
    }

    async inject<KA extends readonly Context.Key[]>(...keys: KA): Promise<Context.UnboxedKeys<KA>> {
        const unknownKeys = keys.filter(key => !this._factories.has(key));

        if (unknownKeys.length) {
            throw this._error(new Error(`Unknown keys (${unknownKeys.length}): ${unknownKeys}`), Context.UNKNOWN_KEYS);
        }

        let outcome: any;
        const outcomes: any[] = [];

        for (const key of keys) {
            if (this._dependencies.has(key)) {
                outcomes.push(this._dependencies.get(key));
            } else {
                outcome = this._factories.get(key)?.(this);

                if (outcome instanceof Promise) {
                    try {
                        outcome = await outcome;
                    } catch (suppressed) {
                        const error = new Error(`Factory failure for key "${key as any}"`);
                        throw Object.assign(this._error(error, Context.FACTORY_FAILURE), { suppressed });
                    }
                } else {
                    outcomes.push(outcome);
                }

                this._dependencies.set(key, outcome);
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
