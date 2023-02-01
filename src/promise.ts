export class Promise<T> implements PromiseLike<T> {
    #resolve = (value: T | PromiseLike<T>) => {
        this.#resolve = () => undefined;
        this.#reject = () => undefined;

        if (Promise.#isPromiseLike<T>(value)) {
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

    static allSettled<T extends readonly unknown[] | []>(values: T): Promise<{
        -readonly [P in keyof T]: PromiseSettledResult<Awaited<T[P]>>;
    }>;
    static allSettled<T>(values: Iterable<T | PromiseLike<T>>): Promise<PromiseSettledResult<Awaited<T>>[]>;
    static allSettled(values: any): Promise<PromiseSettledResult<unknown>[]> {
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

    finally(onFinally?: (() => void) | undefined | null): Promise<T> {
        const NextConstructor = this.#nextConstructor();
        return new NextConstructor<T>((resolve, reject) => {
            if ('pending' === this.#status) {
                this.#fulfillmentListeners.push(value =>
                    Promise.#onFinally(onFinally, {value}, resolve, reject));
                this.#rejectionListeners.push(reason =>
                    Promise.#onFinally(onFinally, {reason}, resolve, reject));
            } else if ('rejected' === this.#status) {
                setTimeout(() => Promise.#onFinally(onFinally, {reason: this.#reason}, resolve, reject));
            } else if ('fulfilled' === this.#status) {
                setTimeout(() => Promise.#onFinally(onFinally, {value: this.#value}, resolve, reject));
            }
        }) as Promise<T>;
    }

    catch<R = never>(onRejected?: ((reason: any) => (PromiseLike<R> | R)) | undefined | null): Promise<T | R> {
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

    then<F = T, R = never>(onFulfilled?: ((value: T) => (PromiseLike<F> | F)) | undefined | null,
                           onRejected?: ((reason: any) => (PromiseLike<R> | R)) | undefined | null): Promise<F | R> {
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

    static #onFulfilled<R>(onFulfilled: ((value: any) => (PromiseLike<R> | R)) | undefined | null,
                           resolve: (value: any) => void, reject: (reason: any) => void, value: any): void {
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

    static #onRejected<R = never>(onRejected: ((reason: any) => (PromiseLike<R> | R)) | undefined | null,
                                  resolve: (value: any) => void, reject: (reason: any) => void, reason: any): void {
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

    static #onFinally(onFinally: (() => void) | undefined | null, content: { value: any } | { reason: any },
                      resolve: (value: any) => void, reject: (reason: any) => void): void {
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
