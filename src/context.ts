export class Context {
    static readonly FACTORY_FAILURE = 'FACTORY_FAILURE';
    static readonly UNKNOWN_KEYS = 'UNKNOWN_KEYS';

    private readonly _error = (error: Error, name: string) => Object.assign(error, { name }) as Error;
    private readonly _factories = new Map<Context.Key, (context: Context) => any>();
    private readonly _pendingDependencies = new Map<Context.Key, Promise<any>>();
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
        const unknownKeys = keys.filter(key => !this._factories.has(key)).map(symbol => symbol.toString());

        if (unknownKeys.length) {
            const error = new Error(`Unknown keys (${unknownKeys.length}): ${unknownKeys}`);
            throw this._error(error, Context.UNKNOWN_KEYS);
        }

        return await Promise.all(keys.map(key => {
            if (this._dependencies.has(key)) {
                return this._dependencies.get(key);
            } else if (this._pendingDependencies.has(key)) {
                // NOTE: No error handling, because promise not created here
                return this._pendingDependencies.get(key);
            } else {
                let outcome = this._factories.get(key)?.(this);

                if (outcome instanceof Promise) {
                    this._pendingDependencies.set(key, outcome = outcome.then(value => {
                        this._pendingDependencies.delete(key);
                        this._dependencies.set(key, value);
                        return value;
                    }).catch(suppressed => {
                        const error = new Error(`Factory failure for key "${key.toString() as any}"`);
                        throw Object.assign(this._error(error, Context.FACTORY_FAILURE), { suppressed });
                    }));
                } else {
                    this._dependencies.set(key, outcome);
                }

                return outcome;
            }
        })) as any;
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

    export type Factory<I = any> = (context: Context) =>
        Context.UnboxedPromise<I> | Promise<Context.UnboxedPromise<I>>;
}
