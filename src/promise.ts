export class ContextPromise<T> implements PromiseLike<T> {
    #resolve = (value: T | PromiseLike<T>) => {
        this.#resolve = () => undefined;
        this.#reject = () => undefined;

        if (ContextPromise.#isPromiseLike<T>(value)) {
            value.then(value => {
                this.#status = 'fulfilled';
                this.#value = value;

                this.#fulfillmentListeners.forEach(listener => listener(value));
                this.#fulfillmentListeners = [];
                this.#rejectionListeners = [];
            }, reason => {
                this.#status = 'rejected';
                this.#reason = reason;

                this.#rejectionListeners.forEach(listener => listener(reason));
                this.#fulfillmentListeners = [];
                this.#rejectionListeners = [];
            })
        } else {
            this.#status = 'fulfilled';
            this.#value = value;

            this.#fulfillmentListeners.forEach(listener => listener(value));
            this.#fulfillmentListeners = [];
            this.#rejectionListeners = [];
        }
    };
    #reject = (reason?: any) => {
        this.#resolve = () => undefined;
        this.#reject = () => undefined;
        this.#status = 'rejected';
        this.#reason = reason;

        this.#rejectionListeners.forEach(listener => listener(reason));
        this.#rejectionListeners = [];
    };
    #status: 'pending' | 'rejected' | 'fulfilled' = 'pending';
    #rejectionListeners: { (reason: any): any }[] = [];
    #fulfillmentListeners: { (value: T): any }[] = [];
    #reason: any = undefined as any;
    #value: T = undefined as any;

    constructor(executor: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void) {
        try {
            executor(value => this.#resolve(value), reason => this.#reject(reason));
        } catch (error) {
            this.#reject(error);
        }
    }

    static get [Symbol.species](): { new(..._: any[]): PromiseLike<any> } | null | undefined {
        return this;
    }

    static reject<T = never>(reason?: any): ContextPromise<T> {
        return new this((_resolve, reject) => reject(reason));
    }

    static resolve(): ContextPromise<void>;
    static resolve<T>(value: T): ContextPromise<Awaited<T>>;
    static resolve<T>(value: T | PromiseLike<T>): ContextPromise<Awaited<T>>;
    static resolve<T>(value?: T | PromiseLike<T>): ContextPromise<void | Awaited<T>> {
        return new this(resolve => resolve(value as any));
    }

    static all<T extends readonly unknown[] | []>(values: T): ContextPromise<{ -readonly [P in keyof T]: Awaited<T[P]> }> {
        return new this((resolve, reject) => {
            const fulfillment = new Map<unknown, unknown>();

            for (const value of values) {
                if (this.#isPromiseLike(value)) {
                    value.then(resolved => {
                        fulfillment.set(value, resolved);

                        if (fulfillment.size === new Set(values).size) {
                            resolve(values.map(value => fulfillment.get(value)) as any);
                        }
                    }, reject);
                } else {
                    fulfillment.set(value, value);
                }
            }

            if (fulfillment.size === new Set(values).size) {
                resolve(values.map(value => fulfillment.get(value)) as any);
            }
        });
    }

    static any<T extends readonly unknown[] | []>(values: T): ContextPromise<Awaited<T[number]>>;
    static any<T>(values: Iterable<T | PromiseLike<T>>): ContextPromise<Awaited<T>>;
    static any(values: Iterable<any>): ContextPromise<any> {
        return new this((resolve, reject) => {
            if (0 === [...values].length) {
                return reject(new AggregateError([], 'All promises were rejected'));
            }

            const rejections = new Map<unknown, unknown>();

            for (const value of values) {
                if (this.#isPromiseLike(value)) {
                    value.then(resolve, reason => {
                        rejections.set(value, reason);

                        if (rejections.size === new Set(values).size) {
                            const errors = [...values].map(value => rejections.get(value));
                            reject(new AggregateError(errors, 'All promises were rejected'));
                        }
                    });
                } else {
                    resolve(value);
                }
            }
        });
    }

    static race<T extends readonly unknown[] | []>(values: T): ContextPromise<Awaited<T[number]>> {
        return new this((resolve, reject) => {
            for (const value of values) {
                if (this.#isPromiseLike(value)) {
                    value.then(resolve as any, reject)
                } else {
                    resolve(value as any);
                }
            }
        });
    }

    static allSettled<T extends readonly unknown[] | []>(values: T): ContextPromise<{ -readonly [P in keyof T]: PromiseSettledResult<Awaited<T[P]>> }>;
    static allSettled<T>(values: Iterable<T | PromiseLike<T>>): ContextPromise<PromiseSettledResult<Awaited<T>>[]>;
    static allSettled(values: any): ContextPromise<PromiseSettledResult<unknown>[]> {
        return new this(resolve => {
            const settlements = new Map<unknown, PromiseSettledResult<unknown>>();

            for (const value of values) {
                if (this.#isPromiseLike(value)) {
                    value.then(resolved => {
                        settlements.set(value, {value: resolved, status: 'fulfilled'});

                        if (settlements.size === new Set(values).size) {
                            resolve([...values].map(value => settlements.get(value)!));
                        }
                    }, reason => {
                        settlements.set(value, {reason, status: 'rejected'});

                        if (settlements.size === new Set(values).size) {
                            resolve([...values].map(value => settlements.get(value)!));
                        }
                    });
                } else {
                    settlements.set(value, {value, status: 'fulfilled'});
                }
            }

            if (settlements.size === new Set(values).size) {
                resolve([...values].map(value => settlements.get(value)!));
            }
        });
    }

    get [Symbol.toStringTag](): string {
        return ContextPromise.name;
    }

    finally(onFinally?: (() => void) | undefined | null): ContextPromise<T> {
        const NextConstructor = this.#nextConstructor();
        // @formatter:off
        onFinally ??= () => {};
        // @formatter:on
        return new NextConstructor<T>((resolve, reject) => {
            if ('pending' === this.#status) {
                this.#fulfillmentListeners.push(value => {
                    try {
                        onFinally!();
                        resolve(value)
                    } catch (error) {
                        reject(error);
                    }
                });
                this.#rejectionListeners.push(reason => {
                    try {
                        onFinally!();
                        reject(reason);
                    } catch (error) {
                        reject(error);
                    }
                });
            } else if ('rejected' === this.#status) {
                setTimeout(() => {
                    try {
                        onFinally!();
                        reject(this.#reason);
                    } catch (error) {
                        reject(error);
                    }
                });
            } else if ('fulfilled' === this.#status) {
                setTimeout(() => {
                    try {
                        onFinally!();
                        resolve(this.#value);
                    } catch (error) {
                        reject(error);
                    }
                });
            }
        }) as ContextPromise<T>;
    }

    catch<TResult = never>(onRejected?: ((reason: any) => (PromiseLike<TResult> | TResult)) | undefined | null): ContextPromise<T | TResult> {
        const NextConstructor = this.#nextConstructor();
        onRejected ??= (reason: any) => NextConstructor.reject(reason);
        return new NextConstructor<T | TResult>((resolve, reject) => {
            if ('pending' === this.#status) {
                this.#rejectionListeners.push(reason => {
                    try {
                        resolve(onRejected!(reason))
                    } catch (error) {
                        reject(error);
                    }
                });
            } else if ('rejected' === this.#status) {
                setTimeout(() => {
                    try {
                        resolve(onRejected!(this.#reason))
                    } catch (error) {
                        reject(error);
                    }
                });
            } else if ('fulfilled' === this.#status) {
                resolve(this.#value);
            }
        }) as ContextPromise<T | TResult>;
    }

    then<TResult1 = T, TResult2 = never>(
        onFulfilled?: ((value: T) => (PromiseLike<TResult1> | TResult1)) | undefined | null,
        onRejected?: ((reason: any) => (PromiseLike<TResult2> | TResult2)) | undefined | null
    ): ContextPromise<TResult1 | TResult2> {
        const NextConstructor = this.#nextConstructor();
        onRejected ??= (reason: any) => NextConstructor.reject(reason);
        onFulfilled ??= (value: T): TResult1 | PromiseLike<TResult1> => value as any;
        return new NextConstructor<TResult1 | TResult2>((resolve, reject) => {
            if ('pending' === this.#status) {
                this.#fulfillmentListeners.push(value => {
                    try {
                        resolve(onFulfilled!(value))
                    } catch (error) {
                        reject(error);
                    }
                });
                this.#rejectionListeners.push(reason => {
                    try {
                        resolve(onRejected!(reason))
                    } catch (error) {
                        reject(error);
                    }
                });
            } else if ('rejected' === this.#status) {
                setTimeout(() => {
                    try {
                        resolve(onRejected!(this.#reason))
                    } catch (error) {
                        reject(error);
                    }
                });
            } else if ('fulfilled' === this.#status) {
                setTimeout(() => {
                    try {
                        resolve(onFulfilled!(this.#value))
                    } catch (error) {
                        reject(error);
                    }
                });
            }
        }) as ContextPromise<TResult1 | TResult2>;
    }

    static #isPromiseLike<T>(value: any): value is PromiseLike<T> {
        return value && ('object' === typeof value) && ('then' in value) && ('function' === typeof value['then']);
    }

    #nextConstructor(): PromiseConstructor {
        return (this.constructor as any)[Symbol.species] ?? ContextPromise;
    }
}
