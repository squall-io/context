import {Context} from ".";

/**
 * @name Promise
 * @description The Promise object represents the eventual completion (or failure) of an asynchronous operation and its
 *              resulting value.
 * @description An ES2018-compliant implementation of the Promise API, augmented with context-awareness.
 *              All the methods then, catch, finally pass a context as a second parameter, when not null-ish.
 *              Of the concurrent API, any & race forward the context of the settled promise, allSettled
 *              associate context, when available, to each of the aggregate's entry and, all just discards the context
 *              of its settling promise.
 * @description IMPORTANT: For compatibility with the async/await, this implementation has the instance getter `context`
 *              that resolves to a thenable exposing a tuple: [valueOrReason, context?]. Which all the async/await API
 *              requires.
 *
 * @see then
 * @see catch
 * @see finally
 * @see all
 * @see any
 * @see race
 * @see allSettled
 */
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

    /**
     * @constructor
     * @description The Promise() constructor is primarily used to wrap functions that do not already support promises.
     *
     * @param executor A function to be executed by the constructor. It receives two functions as parameters:
     *                 resolveFunc and rejectFunc. Any errors thrown in the executor will cause the promise to be
     *                 rejected, and the return value will be neglected. The callback accept a second, optional context
     *                 parameter to propagate their state.
     * @param context [optional] A context to use as fallback if the promise settles without context.
     */
    constructor(executor: Promise.Executor<T>, context?: Context) {
        try {
            this.#context = context;
            executor((value, context) => this.#resolve(value, context ?? this.#context),
                (reason, context) => this.#reject(reason, context ?? this.#context));
        } catch (error) {
            this.#reject(error, this.#context);
        }
    }

    /**
     * @description The Promise[@@species] static accessor property returns the constructor used to construct return
     *              values from promise methods.
     *
     * @see then
     * @see catch
     * @see finally
     */
    static get [Symbol.species](): { new(..._: any[]): PromiseLike<any> } | null | undefined {
        return this;
    }

    /**
     * @description The Promise.reject() static method returns a Promise object that is rejected with a given reason.
     *
     * @param reason Reason why this Promise rejected.
     * @param context [optional] The context to use as fallback context in the returned promise.
     */
    static reject<T = never>(reason?: any, context?: Context): Promise<T> {
        return new this((_resolve, reject) => reject(reason, context));
    }

    /**
     * @description The Promise.resolve() static method "resolves" a given value to a Promise. If the value is a
     *              promise, that promise is returned; if the value is a thenable, Promise.resolve() will call the
     *              then() method with two callbacks it prepared; otherwise the returned promise will be fulfilled
     *              with the value.
     *
     * @description This function flattens nested layers of promise-like objects (e.g. a promise that fulfills to a
     *              promise that fulfills to something) into a single layer — a promise that fulfills to a non-thenable
     *              value.
     */
    static resolve(): Promise<void>;
    /**
     * @description The Promise.resolve() static method "resolves" a given value to a Promise. If the value is a
     *              promise, that promise is returned; if the value is a thenable, Promise.resolve() will call the
     *              then() method with two callbacks it prepared; otherwise the returned promise will be fulfilled
     *              with the value.
     *
     * @description This function flattens nested layers of promise-like objects (e.g. a promise that fulfills to a
     *              promise that fulfills to something) into a single layer — a promise that fulfills to a non-thenable
     *              value.
     *
     * @param value Argument to be resolved by this Promise. Can also be a Promise or a thenable to resolve.
     * @param context [optional] The context to use as fallback context in the returned promise.
     */
    static resolve<T>(value: T, context?: Context): Promise<Awaited<T>>;
    /**
     * @description The Promise.resolve() static method "resolves" a given value to a Promise. If the value is a
     *              promise, that promise is returned; if the value is a thenable, Promise.resolve() will call the
     *              then() method with two callbacks it prepared; otherwise the returned promise will be fulfilled
     *              with the value.
     *
     * @description This function flattens nested layers of promise-like objects (e.g. a promise that fulfills to a
     *              promise that fulfills to something) into a single layer — a promise that fulfills to a non-thenable
     *              value.
     *
     * @param value Argument to be resolved by this Promise. Can also be a Promise or a thenable to resolve.
     * @param context [optional] The context to use as fallback context in the returned promise.
     */
    static resolve<T>(value: T | PromiseLike<T>, context?: Context): Promise<Awaited<T>>;
    static resolve<T>(value?: T | PromiseLike<T>, context?: Context): Promise<void | Awaited<T>> {
        return new this(resolve => resolve(value as any, context));
    }

    /**
     * @description The Promise.all() static method takes an iterable of promises as input and returns a single Promise.
     *              This returned promise fulfills when all the input's promises fulfill (including when an empty
     *              iterable is passed), with an array of the fulfillment values. It rejects when any of the input's
     *              promises rejects, with this first rejection reason.
     * @description When fulfilling, the resulting has a read-only context property, where entry are context-aware
     *              values.
     *
     * @param values An iterable (such as an Array) of promises.
     * @param context [optional] The context to use as fallback for each of values entries.
     */
    static all<T extends readonly unknown[] | []>(values: T, context?: Context):
        Promise<{ -readonly [P in keyof T]: Awaited<T[P]> } & {
            readonly context: { -readonly [P in keyof T]: [Awaited<T[P]>, Context?] };
        }> {
        return new this((resolve, reject) => {
            const fulfillContext = new Map<unknown, Context | undefined>();
            const fulfillValues = new Map<unknown, unknown>();
            const uniqueValues = new Set(values);

            for (const value of uniqueValues) {
                if (this.#isPromiseLike(value)) {
                    value.then((resolved, ctx?: Context) => {
                        fulfillValues.set(value, resolved);
                        fulfillContext.set(value, ctx ?? context);

                        if (fulfillValues.size === uniqueValues.size) {
                            const outcomes = values.map(value => fulfillValues.get(value));
                            Reflect.defineProperty(outcomes, 'context', {
                                value: Object.freeze(values.map(key => {
                                    const ctx = fulfillContext.get(key);
                                    return ctx ? [fulfillValues.get(key), ctx] : [fulfillValues.get(key)];
                                })),
                                enumerable: false,
                                writable: false,
                            });
                            resolve(outcomes as any, context);
                        }
                    }, (reason, ctx?: Context) => reject(reason, ctx ?? context));
                } else {
                    fulfillValues.set(value, value);
                    fulfillContext.set(value, context);
                }
            }

            if (fulfillValues.size === uniqueValues.size) {
                const outcomes = values.map(value => fulfillValues.get(value));
                Reflect.defineProperty(outcomes, 'context', {
                    value: Object.freeze(values.map(key => {
                        const value = fulfillValues.get(key);
                        return context ? [value, context] : [value];
                    })),
                    enumerable: false,
                    writable: false,
                });
                resolve(outcomes as any, context);
            }
        });
    }

    /**
     * @description The Promise.any() static method takes an iterable of promises as input and returns a single Promise.
     *              This returned promise fulfills when any of the input's promises fulfills, with this first
     *              fulfillment value. It rejects when all the input's promises reject (including when an empty iterable
     *              is passed), with an AggregateError containing an array of rejection reasons.
     *
     * @param values An iterable (such as an Array) of promises.
     * @param context [optional] The context to use as fallback context in the returned promise.
     */
    static any<T extends readonly unknown[] | []>(values: T, context?: Context): Promise<Awaited<T[number]>>;
    /**
     * @description The Promise.any() static method takes an iterable of promises as input and returns a single Promise.
     *              This returned promise fulfills when any of the input's promises fulfills, with this first
     *              fulfillment value. It rejects when all the input's promises reject (including when an empty iterable
     *              is passed), with an AggregateError containing an array of rejection reasons.
     *
     * @param values An iterable (such as an Array) of promises.
     * @param context [optional] The context to use as fallback context in the returned promise.
     */
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

    /**
     * @description The Promise.race() static method takes an iterable of promises as input and returns a single
     *              Promise. This returned promise settles with the eventual state of the first promise that settles.
     *
     * @param values An iterable (such as an Array) of promises.
     * @param context [optional] The context to use as fallback context in the returned promise.
     */
    static race<T extends readonly unknown[] | []>(values: T, context?: Context): Promise<Awaited<T[number]>> {
        return new this((resolve, reject) => {
            for (const value of values) {
                if (this.#isPromiseLike(value)) {
                    value.then((value: any, ctx?: Context) => resolve(value, ctx ?? context),
                        (reason: any, ctx?: Context) => reject(reason, ctx ?? context))
                } else {
                    resolve(value as any, context);
                }
            }
        });
    }

    /**
     * @description The Promise.allSettled() static method takes an iterable of promises as input and returns a single
     *              Promise. This returned promise fulfills when all the input's promises settle (including when an
     *              empty iterable is passed), with an array of objects that describe the outcome of each promise.
     *
     * @param values An iterable (such as an Array) of promises.
     * @param context [optional] The context to use as fallback context in the aggregate.
     */
    static allSettled<T extends readonly unknown[] | []>(values: T, context?: Context):
        Promise<{ -readonly [P in keyof T]: Promise.SettledResult<Awaited<T[P]>>; }>;
    /**
     @description The Promise.allSettled() static method takes an iterable of promises as input and returns a single
     Promise. This returned promise fulfills when all the input's promises settle (including when an
     empty iterable is passed), with an array of objects that describe the outcome of each promise.

     @param values An iterable (such as an Array) of promises.
     @param context [optional] The context to use as fallback context in the aggregate.
     */
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

    /**
     * @description A utility method to wrap a non-context-aware promise implementation into one.
     *
     * @param promise The original promise.
     * @param context [optional] The context to use as fallback if the original promise is not context-aware.
     */
    static from<P extends PromiseLike<I>, I>(promise: P, context?: Context): Promise<I> {
        if (this.#isPromiseLike(promise)) {
            if (promise instanceof Promise) {
                return promise as any;
            } else {
                return new Promise((resolve, reject) => promise.then(resolve, reject), context) as any;
            }
        }

        throw new Error(`Not a thenable: ${promise}.`);
    }

    get [Symbol.toStringTag](): string {
        return Promise.name;
    }

    /**
     * @description Return a thenable that settle with a context-aware tuple rather just the value of the reason.
     */
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

    /**
     * @description The finally() method of a Promise object schedules a function to be called when the promise is
     *              settled (either fulfilled or rejected). It immediately returns an equivalent Promise object,
     *              allowing you to chain calls to other promise methods.
     *
     * @param onFinally [optional] A Function called when the Promise is settled. This handler receives one optional
     *                  parameters: the context with which the promise did settle.
     */
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

    /**
     * The catch() method of a Promise object schedules a function to be called when the promise is rejected. It
     * immediately returns an equivalent Promise object, allowing you to chain calls to other promise methods. It is a
     * shortcut for Promise.prototype.then(undefined, onRejected).
     *
     * @param onRejected A Function called when the Promise is rejected. This function has one required parameter: the
     *                   rejection reason and, the second optional parameter, the context if any non-nullish.
     */
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

    /**
     * @description The then() method of a Promise object takes up to two arguments: callback functions for the
     *              fulfilled and rejected cases of the Promise. It immediately returns an equivalent Promise object,
     *              allowing you to chain calls to other promise methods.
     *
     * @param onFulfilled [optional] A Function asynchronously called if the Promise is fulfilled. This function has one
     *                    required parameter, the fulfillment value and, the second, optional, the context. If it is not
     *                    a function, it is internally replaced with an identity function ((x) => x) which simply passes
     *                    the fulfillment value forward.
     * @param onRejected [optional] A Function asynchronously called if the Promise is rejected. This function has one
     *                   required parameter, the rejection reason and, optionally, the context if available as second
     *                   parameter. If it is not a function, it is internally replaced with a thrower function
     *                   ((x) => { throw x; }) which throws the rejection reason it received.
     */
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
