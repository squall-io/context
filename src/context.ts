export class Context {
    private readonly _factories = new WeakMap<Context.Key, (context: Context) => any>();

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
}

export namespace Context {
    export type Key<T = any> = Token<T> | Constructor<T>;

    export type Token<T = any> = symbol & Record<never, T>;

    export type Constructor<T = any, D extends any[] = any[]> = {
        new(...dependencies: D): T;
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
