export class Promise<T> implements PromiseLike<T> {
    #resolve = (value: T | PromiseLike<T>) => {
        this.#resolve = () => undefined;
        this.#reject = () => undefined;

        if (Promise.#isPromiseLike<T>(value)) {
            value.then(value => {
                [this.#status, this.#value] = ['fulfilled', value];
                setTimeout(listeners => {
                    listeners.forEach(listener => listener(value))
                }, 0, this.#fulfillmentListeners);
                [this.#fulfillmentListeners, this.#rejectionListeners] = [[], []];
            }, reason => {
                [this.#status, this.#reason] = ['rejected', reason];
                setTimeout(listeners => {
                    listeners.forEach(listener => listener(reason))
                }, 0, this.#rejectionListeners);
                [this.#fulfillmentListeners, this.#rejectionListeners] = [[], []];
            })
        } else {
            [this.#status, this.#value] = ['fulfilled', value];
            this.#fulfillmentListeners.forEach(listener => listener(value));
            setTimeout(listeners => {
                listeners.forEach(listener => listener(value))
            }, 0, this.#fulfillmentListeners);
            [this.#fulfillmentListeners, this.#rejectionListeners] = [[], []];
        }
    };
    #reject = (reason?: any) => {
        [this.#resolve, this.#reject, this.#status, this.#reason] = [() => void 0, () => void 0, 'rejected', reason];
        setTimeout(listeners => {
            listeners.forEach(listener => listener(reason))
        }, 0, this.#rejectionListeners);
        [this.#fulfillmentListeners, this.#rejectionListeners] = [[], []];
    };
    #status: 'pending' | 'rejected' | 'fulfilled' = 'pending';
    #rejectionListeners: { (reason: any): any }[] = [];
    #fulfillmentListeners: { (value: T): any }[] = [];
    #reason: any = undefined as any;
    #value: T = undefined as any;

    constructor(executor: Promise.Executor<T>) {
        try {
            executor(value => this.#resolve(value), reason => this.#reject(reason));
        } catch (error) {
            this.#reject(error);
        }
    }

    static get [Symbol.species](): { new(..._: any[]): PromiseLike<any> } | null | undefined {
        return this;
    }

    static reject<T = never>(reason?: any): Promise<T> {
        return new this((_resolve, reject) => reject(reason));
    }

    static resolve(): Promise<void>;
    static resolve<T>(value: T): Promise<Awaited<T>>;
    static resolve<T>(value: T | PromiseLike<T>): Promise<Awaited<T>>;
    static resolve<T>(value?: T | PromiseLike<T>): Promise<void | Awaited<T>> {
        return new this(resolve => resolve(value as any));
    }

    static all<T extends readonly unknown[] | []>(values: T): Promise<{ -readonly [P in keyof T]: Awaited<T[P]> }> {
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

    static any<T extends readonly unknown[] | []>(values: T): Promise<Awaited<T[number]>>;
    static any<T>(values: Iterable<T | PromiseLike<T>>): Promise<Awaited<T>>;
    static any(values: Iterable<any>): Promise<any> {
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

    static race<T extends readonly unknown[] | []>(values: T): Promise<Awaited<T[number]>> {
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

    static allSettled<T extends readonly unknown[] | []>(values: T):
        Promise<{ -readonly [P in keyof T]: PromiseSettledResult<Awaited<T[P]>>; }>;
    static allSettled<T>(values: Iterable<T | PromiseLike<T>>):
        Promise<PromiseSettledResult<Awaited<T>>[]>;
    static allSettled(values: Iterable<any>): Promise<PromiseSettledResult<unknown>[]> {
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
        return Promise.name;
    }

    finally(onFinally?: Promise.OnFinally): Promise<T> {
        const NextConstructor = this.#nextConstructor();
        return new NextConstructor<T>((resolve, reject) => {
            if ('pending' === this.#status) {
                this.#fulfillmentListeners.push(value =>
                    Promise.#onFinally(onFinally, resolve, reject, {value}));
                this.#rejectionListeners.push(reason =>
                    Promise.#onFinally(onFinally, resolve, reject, {reason}));
            } else if ('rejected' === this.#status) {
                setTimeout(() => Promise.#onFinally(onFinally, resolve, reject, {reason: this.#reason}));
            } else if ('fulfilled' === this.#status) {
                setTimeout(() => Promise.#onFinally(onFinally, resolve, reject, {value: this.#value}));
            }
        }) as Promise<T>;
    }

    catch<R = never>(onRejected?: Promise.OnRejected<R>): Promise<T | R> {
        const NextConstructor = this.#nextConstructor();
        return new NextConstructor<T | R>((resolve, reject) => {
            if ('pending' === this.#status) {
                this.#rejectionListeners.push(reason => Promise.#onRejected(onRejected, resolve, reject, reason));
            } else if ('rejected' === this.#status) {
                setTimeout(() => Promise.#onRejected(onRejected, resolve, reject, this.#reason));
            } else if ('fulfilled' === this.#status) {
                resolve(this.#value);
            }
        }) as Promise<T | R>;
    }

    then<F = T, R = never>(onFulfilled?: Promise.OnFulfilled<T, F>, onRejected?: Promise.OnRejected<R>): Promise<F | R> {
        const NextConstructor = this.#nextConstructor();
        return new NextConstructor<F | R>((resolve, reject) => {
            if ('pending' === this.#status) {
                this.#fulfillmentListeners.push(value => Promise.#onFulfilled(onFulfilled, resolve, reject, value));
                this.#rejectionListeners.push(reason => Promise.#onRejected(onRejected, resolve, reject, reason));
            } else if ('rejected' === this.#status) {
                setTimeout(() => Promise.#onRejected(onRejected, resolve, reject, this.#reason));
            } else if ('fulfilled' === this.#status) {
                setTimeout(() => Promise.#onFulfilled(onFulfilled, resolve, reject, this.#value));
            }
        }) as Promise<F | R>;
    }

    static #isPromiseLike<T>(value: any): value is PromiseLike<T> {
        return value && ('object' === typeof value) && ('then' in value) && ('function' === typeof value['then']);
    }

    static #onFulfilled<F>(onFulfilled: Promise.OnFulfilled<any, F>,
                           resolve: Promise.Resolve<F>, reject: Promise.Reject, value: any): void {
        if (onFulfilled) {
            try {
                resolve(onFulfilled(value) as any);
            } catch (error) {
                reject(error);
            }
        } else {
            resolve(value);
        }
    }

    static #onRejected<R = never>(onRejected: Promise.OnRejected<R>,
                                  resolve: Promise.Resolve<R>, reject: Promise.Reject, reason: any): void {
        if (onRejected) {
            try {
                resolve(onRejected(reason) as any);
            } catch (error) {
                reject(error);
            }
        } else {
            reject(reason);
        }
    }

    static #onFinally(onFinally: Promise.OnFinally, resolve: Promise.Resolve<any>, reject: Promise.Reject,
                      content: { value: any } | { reason: any }): void {
        try {
            onFinally?.();
            'value' in content ? resolve(content.value) : reject(content.reason);
        } catch (error) {
            reject(error);
        }
    }

    #nextConstructor(): PromiseConstructor {
        return (this.constructor as any)[Symbol.species] ?? Promise;
    }
}

export namespace Promise {
    export type OnFulfilled<T, F> = {
        (value: T): PromiseLike<F> | F;
    } | undefined | null;
    export type OnRejected<R> = {
        (reason: any): PromiseLike<R> | R;
    } | undefined | null;
    export type OnFinally = {
        (): void;
    } | undefined | null;

    export type Executor<T> = {
        (resolve: Promise.Resolve<T>, reject: Promise.Reject): void;
    }
    export type Resolve<T> = {
        (value: T | PromiseLike<T>): void;
    }
    export type Reject = {
        (reason?: any): void;
    }
}
