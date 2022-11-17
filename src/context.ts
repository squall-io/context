/**
 *
 * **Context** - A class to help with dependency injection.
 *
 * See:
 *
 * + `static from(Context)`
 * + `inject(...Contex.Key[]`
 * + `provide(Contex.Key[], ...Context.Factory[])`
 */
export class Context {
    static readonly FACTORY_FAILURE = 'FACTORY_FAILURE';
    static readonly UNKNOWN_KEYS = 'UNKNOWN_KEYS';

    readonly #error = (error: Error, name: string) => Object.assign(error, {name}) as Error;
    readonly #factories = new Map<Context.Key, (context: Context) => any>();
    readonly #pendingDependencies = new Map<Context.Key, Promise<any>>();
    readonly #dependencies = new Map<Context.Key, any>();
    #parent?: Context;

    /**
     *
     * Create a child context, from a parent one.
     *
     * @param parent The parent context to the returned one.
     * @returns A context which parent in the given one.
     */
    static from(parent: Context): Context {
        const context = new Context();
        // @ts-expect-error: Cannot assign to '_parent' because it is a read-only property.ts(2540)
        context.#parent = parent;

        return context;
    }

    /**
     *
     * Provide this context with key/factory pairs, where factories allow for dependency resolution.
     *
     * @param keys An array of keys to provide factory functions for.
     * @param factories A spread function, to compute dependencies, in the same order as keys.
     * @returns A reference to the context on which the method was invoked.
     */
    provide<KA extends readonly Context.Key[]>(keys: KA, ...factories: Context.Factories<KA>[]): this {
        for (let i = 0, l = keys.length; i < l; i++) {
            if (null === factories[i] && 'function' === typeof keys[i]) {
                this.#factories.set(keys[i]!, () => Reflect.construct(keys[i]! as any, [this]));
                continue;
            }

            this.#factories.set(keys[i]!, factories[i]!);
        }

        return this;
    }

    /**
     *
     * Resolve dependencies by key from this context or its ancestory hierarchy.
     *
     * @param keys The spread keys to dependencies to retrieve
     * @returns An promise that resolve with an array of dependencies, matching the order of provided keys
     */
    async inject<KA extends readonly Context.Key[]>(...keys: KA): Promise<Context.UnboxedKeys<KA>> {
        const unknownKeys = keys.filter(key => !this.#factories.has(key));

        if (unknownKeys.length) {
            if (!this.#parent) {
                const error = new Error(`Unknown keys (${unknownKeys.length}): ${unknownKeys.map(symbol => symbol.toString())}`);
                throw this.#error(error, Context.UNKNOWN_KEYS);
            } else {
                const ownKeys = keys.filter(key => !unknownKeys.includes(key));
                // NOTE: We don't use await. We want parents to throw soon as they have unknow keys
                const fromParent = this.#parent.inject(...unknownKeys);
                const fromSelf = this.inject(...ownKeys);

                return Promise.all([fromParent, fromSelf]).then(([fromParent, fromSelf]) => {
                    return keys.map(key => {
                        const index = unknownKeys.indexOf(key);

                        if (0 <= index) return fromParent[index];
                        else return fromSelf[ownKeys.indexOf(key)];
                    });
                }) as any;
            }
        }

        return Promise.all(keys.map(key => {
            if (this.#dependencies.has(key)) {
                return this.#dependencies.get(key);
            } else if (this.#pendingDependencies.has(key)) {
                // NOTE: No error handling, because promise not created here
                return this.#pendingDependencies.get(key);
            } else {
                try {
                    let outcome = this.#factories.get(key)?.(this);

                    if (outcome instanceof Promise) {
                        this.#pendingDependencies.set(key, outcome = outcome.then(value => {
                            this.#pendingDependencies.delete(key);
                            this.#dependencies.set(key, value);
                            return value;
                        }).catch(suppressed => {
                            const error = new Error(`Factory failure for key "${key.toString() as any}"`);
                            throw Object.assign(this.#error(error, Context.FACTORY_FAILURE), {suppressed});
                        }));
                    } else {
                        this.#dependencies.set(key, outcome);
                    }

                    return outcome;
                } catch (suppressed) {
                    const error = new Error(`Factory failure for key "${key.toString() as any}"`);
                    throw Object.assign(this.#error(error, Context.FACTORY_FAILURE), {suppressed});
                }
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
