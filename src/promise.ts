import {Context} from ".";

export class Promise<T> implements PromiseLike<T> {
    #resolve = (value: T | PromiseLike<T>, context?: Context) => {
        [this.#resolve, this.#reject, this.#context] = [() => undefined, () => undefined, context ?? this.#context];

        if (Promise.#isPromiseLike<T>(value)) {
            value.then((value, context?: Context) => {
                [this.#context, this.#status, this.#value] = [context ?? this.#context, 'fulfilled', value];
                setTimeout(listeners => {
                    listeners.forEach(listener => listener(value, this.#context));
                }, 0, this.#fulfillmentListeners);
                [this.#fulfillmentListeners, this.#rejectionListeners] = [[], []];
            }, (reason, context?: Context) => {
                [this.#context, this.#status, this.#reason] = [context ?? this.#context, 'rejected', reason];
                setTimeout(listeners => {
                    listeners.forEach(listener => listener(reason, this.#context));
                }, 0, this.#rejectionListeners);
                [this.#fulfillmentListeners, this.#rejectionListeners] = [[], []];
            })
        } else {
            [this.#status, this.#value] = ['fulfilled', value];
            setTimeout(listeners => {
                listeners.forEach(listener => listener(value, this.#context));
            }, 0, this.#fulfillmentListeners);
            [this.#fulfillmentListeners, this.#rejectionListeners] = [[], []];
        }
    };
    #reject = (reason?: any, context?: Context) => {
        [this.#context, this.#status, this.#reason] = [context ?? this.#context, 'rejected', reason];
        [this.#resolve, this.#reject] = [() => undefined, () => undefined];
        setTimeout(listeners => {
            listeners.forEach(listener => listener(reason, this.#context));
        }, 0, this.#rejectionListeners);
        [this.#fulfillmentListeners, this.#rejectionListeners] = [[], []];
    };
    #status: 'pending' | 'rejected' | 'fulfilled' = 'pending';
    #rejectionListeners: { (reason: any, context?: Context): any }[] = [];
    #fulfillmentListeners: { (value: T, context?: Context): any }[] = [];
    #context?: Context | undefined = undefined;
    #reason: any = undefined as any;
    #value: T = undefined as any;

    constructor(executor: Promise.Executor<T>, context?: Context) {
        try {
            this.#context = context;
            executor((value, context) => this.#resolve(value, context ?? this.#context),
                (reason, context) => this.#reject(reason, context ?? this.#context));
        } catch (error) {
            this.#reject(error, this.#context);
        }
    }

    static get [Symbol.species](): { new(..._: any[]): PromiseLike<any> } | null | undefined {
        return this;
    }

    static reject<T = never>(reason?: any, context?: Context): Promise<T> {
        return new this((_resolve, reject) => reject(reason, context));
    }

    static resolve(): Promise<void>;
    static resolve<T>(value: T, context?: Context): Promise<Awaited<T>>;
    static resolve<T>(value: T | PromiseLike<T>, context?: Context): Promise<Awaited<T>>;
    static resolve<T>(value?: T | PromiseLike<T>, context?: Context): Promise<void | Awaited<T>> {
        return new this(resolve => resolve(value as any, context));
    }

    static all<T extends readonly unknown[] | []>(values: T, context?: Context):
        Promise<{ -readonly [P in keyof T]: Awaited<T[P]> }> {
        return new this((resolve, reject) => {
            const fulfillment = new Map<unknown, unknown>();

            for (const value of values) {
                if (this.#isPromiseLike(value)) {
                    value.then(resolved => {
                        fulfillment.set(value, resolved);

                        if (fulfillment.size === new Set(values).size) {
                            resolve(values.map(value => fulfillment.get(value)) as any, context);
                        }
                    }, reason => reject(reason, context));
                } else {
                    fulfillment.set(value, value);
                }
            }

            if (fulfillment.size === new Set(values).size) {
                resolve(values.map(value => fulfillment.get(value)) as any, context);
            }
        });
    }

    static any<T extends readonly unknown[] | []>(values: T, context?: Context): Promise<Awaited<T[number]>>;
    static any<T>(values: Iterable<T | PromiseLike<T>>, context?: Context): Promise<Awaited<T>>;
    static any(values: Iterable<any>, context?: Context): Promise<any> {
        return new this((resolve, reject) => {
            if (0 === [...values].length) {
                return reject(new AggregateError([], 'All promises were rejected'), context);
            }

            const rejections = new Map<unknown, unknown>();

            for (const value of values) {
                if (this.#isPromiseLike(value)) {
                    value.then(resolve, reason => {
                        rejections.set(value, reason);

                        if (rejections.size === new Set(values).size) {
                            const errors = [...values].map(value => rejections.get(value));
                            reject(new AggregateError(errors, 'All promises were rejected'), context);
                        }
                    });
                } else {
                    resolve(value, context);
                }
            }
        });
    }

    static race<T extends readonly unknown[] | []>(values: T, context?: Context): Promise<Awaited<T[number]>> {
        return new this((resolve, reject) => {
            for (const value of values) {
                if (this.#isPromiseLike(value)) {
                    // value.then(resolve as any, reject)
                    value.then((value: any, ctx?: Context) => resolve(value, ctx ?? context),
                        (reason: any, ctx?: Context) => reject(reason, ctx ?? context))
                } else {
                    resolve(value as any, context);
                }
            }
        });
    }

    static allSettled<T extends readonly unknown[] | []>(values: T, context?: Context):
        Promise<{ -readonly [P in keyof T]: Promise.SettledResult<Awaited<T[P]>>; }>;
    static allSettled<T>(values: Iterable<T | PromiseLike<T>>, context?: Context):
        Promise<Promise.SettledResult<Awaited<T>>[]>;
    static allSettled(values: Iterable<any>, context?: Context): Promise<Promise.SettledResult<unknown>[]> {
        return new this(resolve => {
            const settlements = new Map<unknown, Promise.SettledResult<unknown>>();

            for (const value of values) {
                if (this.#isPromiseLike(value)) {
                    value.then((resolved, ctx?: Context) => {
                        settlements.set(value, {value: resolved, status: 'fulfilled', context: ctx ?? context});

                        if (settlements.size === new Set(values).size) {
                            resolve([...values].map(value => settlements.get(value)!), context);
                        }
                    }, (reason, ctx?: Context) => {
                        settlements.set(value, {reason, status: 'rejected', context: ctx ?? context});

                        if (settlements.size === new Set(values).size) {
                            resolve([...values].map(value => settlements.get(value)!), context);
                        }
                    });
                } else {
                    settlements.set(value, {value, status: 'fulfilled', context: context});
                }
            }

            if (settlements.size === new Set(values).size) {
                resolve([...values].map(value => settlements.get(value)!), context);
            }
        });
    }

    get [Symbol.toStringTag](): string {
        return Promise.name;
    }

    get context(): {
        then<F = T, R = never>(onFulfilled?: Promise.OnFulfilledWithContext<T, F>,
                               onRejected?: Promise.OnRejectedWithContext<R>): Promise<F | R>;
    } {
        return {
            then: <F = T, R = never>(onFulfilled?: Promise.OnFulfilledWithContext<T, F>,
                                     onRejected?: Promise.OnRejectedWithContext<R>) => this.then(
                onFulfilled ? (...args) => onFulfilled(Array.from(args) as any) : onFulfilled as any,
                onRejected ? (...args) => onRejected(Array.from(args) as any) : onRejected as any,
            ),
        };
    }

    finally(onFinally?: Promise.OnFinally): Promise<T> {
        const NextConstructor = this.#nextConstructor();
        return new NextConstructor<T>((resolve, reject) => {
            if ('pending' === this.#status) {
                this.#fulfillmentListeners.push((value, context) =>
                    Promise.#onFinally(onFinally, resolve, reject, {value}, context));
                this.#rejectionListeners.push((reason, context) =>
                    Promise.#onFinally(onFinally, resolve, reject, {reason}, context));
            } else if ('rejected' === this.#status) {
                setTimeout(() =>
                    Promise.#onFinally(onFinally, resolve, reject, {reason: this.#reason}, this.#context));
            } else if ('fulfilled' === this.#status) {
                setTimeout(() =>
                    Promise.#onFinally(onFinally, resolve, reject, {value: this.#value}, this.#context));
            }
        }) as Promise<T>;
    }

    catch<R = never>(onRejected?: Promise.OnRejected<R>): Promise<T | R> {
        const NextConstructor = this.#nextConstructor();
        return new NextConstructor<T | R>((resolve, reject) => {
            if ('pending' === this.#status) {
                this.#rejectionListeners.push((reason, context) =>
                    Promise.#onRejected(onRejected, resolve, reject, reason, context ?? context));
            } else if ('rejected' === this.#status) {
                setTimeout(() =>
                    Promise.#onRejected(onRejected, resolve, reject, this.#reason, this.#context));
            } else if ('fulfilled' === this.#status) {
                setTimeout(() =>
                    Promise.#onFulfilled(null, resolve, reject, this.#value, this.#context));
            }
        }) as Promise<T | R>;
    }

    then<F = T, R = never>(onFulfilled?: Promise.OnFulfilled<T, F>, onRejected?: Promise.OnRejected<R>): Promise<F | R> {
        const NextConstructor = this.#nextConstructor();
        return new NextConstructor<F | R>((resolve, reject) => {
            if ('pending' === this.#status) {
                this.#fulfillmentListeners.push((value, context) =>
                    Promise.#onFulfilled(onFulfilled, resolve, reject, value, context ?? this.#context));
                this.#rejectionListeners.push((reason, context) =>
                    Promise.#onRejected(onRejected, resolve, reject, reason, context ?? this.#context));
            } else if ('rejected' === this.#status) {
                setTimeout(() => Promise.#onRejected(onRejected, resolve, reject, this.#reason, this.#context));
            } else if ('fulfilled' === this.#status) {
                setTimeout(() => Promise.#onFulfilled(onFulfilled, resolve, reject, this.#value, this.#context));
            }
        }) as Promise<F | R>;
    }

    static #isPromiseLike<T>(value: any): value is PromiseLike<T> {
        return value && ('object' === typeof value) && ('then' in value) && ('function' === typeof value['then']);
    }

    static #onFulfilled<F>(onFulfilled: Promise.OnFulfilled<any, F>,
                           resolve: Promise.Resolve<F>, reject: Promise.Reject,
                           value: any, context?: Context): void {
        if (onFulfilled) {
            try {
                context
                    ? resolve(onFulfilled(value, context) as any, context)
                    : resolve(onFulfilled(value));
            } catch (error) {
                reject(error, context);
            }
        } else {
            resolve(value, context);
        }
    }

    static #onRejected<R = never>(onRejected: Promise.OnRejected<R>,
                                  resolve: Promise.Resolve<R>, reject: Promise.Reject,
                                  reason: any, context?: Context): void {
        if (onRejected) {
            try {
                context
                    ? resolve(onRejected(reason, context) as any, context)
                    : resolve(onRejected((reason)));
            } catch (error) {
                reject(error, context);
            }
        } else {
            reject(reason, context);
        }
    }

    static #onFinally(onFinally: Promise.OnFinally, resolve: Promise.Resolve<any>, reject: Promise.Reject,
                      content: { value: any } | { reason: any }, context?: Context): void {
        try {
            onFinally?.(...context ? [context] : []);
            'value' in content ? resolve(content.value, context) : reject(content.reason, context);
        } catch (error) {
            reject(error, context);
        }
    }

    #nextConstructor(): PromiseConstructor {
        return (this.constructor as any)[Symbol.species] ?? Promise;
    }
}

export namespace Promise {
    export type OnFulfilledWithContext<T, F> = {
        (valueWithContext: Promise.ContextAwareValue<T>): PromiseLike<F> | F;
    } | undefined | null;
    export type OnRejectedWithContext<R> = {
        (reasonWithContext: Promise.ContextAwareReason): PromiseLike<R> | R;
    } | undefined | null;
    export type ContextAwareReason = [reason: any, context?: Context];
    export type ContextAwareValue<T> = [value: T, context?: Context];

    export type OnFulfilled<T, F> = {
        (value: T, context?: Context): PromiseLike<F> | F;
    } | undefined | null;
    export type OnRejected<R> = {
        (reason: any, context?: Context): PromiseLike<R> | R;
    } | undefined | null;
    export type OnFinally = {
        (context?: Context): void;
    } | undefined | null;

    export type Executor<T> = {
        (resolve: Promise.Resolve<T>, reject: Promise.Reject, context?: Context): void;
    }
    export type Resolve<T> = {
        (value: T | PromiseLike<T>, context?: Context): void;
    }
    export type Reject = {
        (reason?: any, context?: Context): void;
    }

    export interface FulfilledResult<T> extends PromiseFulfilledResult<T> {
        context?: Context | undefined | null;
    }
    export interface RejectedResult extends PromiseRejectedResult {
        context?: Context | undefined | null;
    }
    export type SettledResult<T> = FulfilledResult<T> | RejectedResult;
}

declare function setTimeout<A extends any[]>(fn: (...args: A) => any, ms?: number, ...args: A): number;
