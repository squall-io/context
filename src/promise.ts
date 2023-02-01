export class ContextPromise<T> implements PromiseLike<T> {
    constructor(_executor: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void) {
    }

    static get [Symbol.species](): { new(..._: any[]): PromiseLike<any> } | null | undefined {
        return this;
    }

    static reject<T = never>(_reason?: any): Promise<T> {
        throw new Error('Not yet implemented');
    }

    static resolve(): Promise<void>;
    static resolve<T>(value: T): Promise<Awaited<T>>;
    static resolve<T>(value: T | PromiseLike<T>): Promise<Awaited<T>>;
    static resolve(_value?: any): Promise<any> {
        throw new Error('Not yet implemented');
    }

    static all<T extends readonly unknown[] | []>(_values: T): Promise<{ -readonly [P in keyof T]: Awaited<T[P]> }> {
        throw new Error('Not yet implemented');
    }

    static any<T extends readonly unknown[] | []>(values: T): Promise<Awaited<T[number]>>;
    static any<T>(values: Iterable<T | PromiseLike<T>>): Promise<Awaited<T>>;
    static any(_values: any): Promise<any> {
        throw new Error('Not yet implemented');
    }

    static race<T extends readonly unknown[] | []>(_values: T): Promise<Awaited<T[number]>> {
        throw new Error('Not yet implemented');
    }

    static allSettled<T extends readonly unknown[] | []>(values: T): Promise<{ -readonly [P in keyof T]: PromiseSettledResult<Awaited<T[P]>> }>;
    static allSettled<T>(values: Iterable<T | PromiseLike<T>>): Promise<PromiseSettledResult<Awaited<T>>[]>;
    static allSettled(_values: any): Promise<PromiseSettledResult<any>[]> {
        throw new Error('Not yet implemented');
    }

    get [Symbol.toStringTag](): string {
        return this.constructor.name;
    }

    finally(_onfinally?: (() => void) | undefined | null): ContextPromise<T> {
        throw new Error('Not yet implemented');
    }

    catch<TResult = never>(_onrejected?: ((reason: any) => (PromiseLike<TResult> | TResult)) | undefined | null): ContextPromise<T | TResult> {
        throw new Error('Not yet implemented');
    }

    then<TResult1 = T, TResult2 = never>(
        _onfulfilled?: ((value: T) => (PromiseLike<TResult1> | TResult1)) | undefined | null,
        _onrejected?: ((reason: any) => (PromiseLike<TResult2> | TResult2)) | undefined | null): Promise<TResult1 | TResult2> {
        throw new Error('Not yet implemented');
    }
}

// const OriginalPromise: PromiseConstructorLike = (() => {
//     if ('object' === typeof globalThis && null !== globalThis) {
//         return globalThis.Promise;
//     } else if ('object' === typeof Promise && null !== Promise) {
//         return Promise;
//     }
//     return null as any;
// })();
//
// export class Promise<T> implements PromiseLike<T> {
//     static #ID = 0;
//
//     #fulfillListeners: { (value: Awaited<T>): void }[] = [];
//     #rejectListeners: { (reason: any): void }[] = [];
//     #status: Status = Status.PENDING;
//     readonly #id: number;
//     #value?: Awaited<T>;
//     #locked = false;
//     #reason?: any;
//
//     constructor(executor: Promise.Executor<T>) {
//         this.#id = Promise.#ID++;
//         this.#status = Status.PENDING;
//         if ('function' === typeof executor) {
//             try {
//                 executor(value => this.#locked || this.#settle(value, Status.FULFILLED),
//                     reason => this.#settle(reason, Status.REJECTED));
//             } catch (error) {
//                 this.#settle(error, Status.REJECTED);
//             }
//         } else {
//             throw new TypeError(`Promise resolver ${
//                 [undefined, null].includes(executor) ? executor : Object.prototype.toString.call(executor)
//             } is not a function`);
//         }
//     }
//
//     then<TF = T, TR = never>(
//         onFulfilled?: Promise.Then<T, TF>, onRejected?: Promise.Catch<TR>): PromiseLike<TF | TR> {
//         return this.#fromSpecies<TF | TR>((resolve, reject) => {
//             switch (this.#status) {
//                 case Status.PENDING:
//                     this.#fulfillListeners.push(value => this.#fulfill(value, reject, resolve, onFulfilled));
//                     this.#rejectListeners.push(reason => this.#reject(reason, reject, resolve, onRejected));
//                     break;
//                 case Status.REJECTED:
//                     this.#reject(this.#reason, reject, resolve, onRejected);
//                     break;
//                 case Status.FULFILLED:
//                     this.#fulfill(this.#value!, reject, resolve, onFulfilled);
//                     break;
//             }
//         });
//     }
//
//     catch<TR = never>(onRejected?: Promise.Catch<TR>): PromiseLike<TR | T> {
//         return this.#fromSpecies<TR | T>((resolve, reject) => {
//             switch (this.#status) {
//                 case Status.PENDING:
//                     this.#fulfillListeners.push(value => this.#fulfill(value, reject, resolve, undefined));
//                     this.#rejectListeners.push(reason => this.#reject(reason, reject, resolve, onRejected));
//                     break;
//                 case Status.REJECTED:
//                     this.#reject(this.#reason, reject, resolve, onRejected);
//                     break;
//                 case Status.FULFILLED:
//                     resolve(this.#value!);
//                     break;
//             }
//         });
//     }
//
//     finally(onFinally?: Promise.Finally): PromiseLike<T> {
//         return this.#fromSpecies<T>((resolve, reject) => {
//             switch (this.#status) {
//                 case Status.PENDING:
//                     this.#rejectListeners.push(reason => this.#finally({reason}, reject, resolve, onFinally));
//                     this.#fulfillListeners.push(value => this.#finally({value}, reject, resolve, onFinally));
//                     break;
//                 case Status.REJECTED:
//                     this.#finally({reason: this.#reason}, reject, resolve, onFinally);
//                     break;
//                 case Status.FULFILLED:
//                     this.#finally({value: this.#value}, reject, resolve, onFinally);
//                     break;
//             }
//         });
//     }
//
//     valueOf(): { id: number, status: Status, value?: Awaited<T> | undefined, reason?: any } {
//         return {
//             id: this.#id,
//             status: this.#status,
//             ...Status.REJECTED
//                 ? {reason: this.#reason}
//                 : Status.PENDING === this.#status
//                     ? {value: this.#value} : {},
//         };
//     }
//
//     get [Symbol.toStringTag](): string {
//         return this.constructor.name;
//     }
//
//     static get [Symbol.species](): PromiseConstructorLike {
//         return this as any;
//     }
//
//     static get [Symbol.toStringTag](): string {
//         return this.name;
//     }
//
//     static allSettled<T extends readonly unknown[]>(
//         values: T): Promise<{ -readonly [P in keyof T]: PromiseSettledResult<Awaited<T[P]>> }>;
//     static allSettled<T>(
//         values: Iterable<T | PromiseLike<T>>): Promise<PromiseSettledResult<Awaited<T>>[]>;
//     static allSettled(
//         values: Iterable<unknown> | unknown[]): Promise<PromiseSettledResult<unknown>[]> {
//         const [count, results] = [new Set(values).size, new Map<unknown, PromiseSettledResult<unknown>>()];
//         return new this<PromiseSettledResult<unknown>[]>(resolve => {
//             for (const value of values) {
//                 if (this.#isThenable(value)) {
//                     value.then(v => {
//                         results.set(value, {value: v, status: 'fulfilled'});
//                         count === results.size && resolve([...values].map(key => results.get(key)) as any[]);
//                     }, r => {
//                         results.set(value, {reason: r, status: 'rejected'});
//                         count === results.size && resolve([...values].map(key => results.get(key)) as any[]);
//                     })
//                 } else {
//                     results.set(value, {value, status: 'fulfilled'});
//                     count === results.size && resolve([...values].map(key => results.get(key)) as any[]);
//                 }
//             }
//         });
//     }
//
//     static any<TT extends readonly unknown[]>(values: TT): Promise<Awaited<TT[number]>>;
//     static any<T>(values: Iterable<T | Promise<T>>): Promise<Awaited<T>>;
//     static any(values: unknown[] | Iterable<unknown>): Promise<unknown[]> {
//         const [count, reasons] = [new Set(values).size, new Map<unknown, unknown>()];
//         return new this<any>((resolve, reject) => {
//             for (const value of values) {
//                 if (this.#isThenable(value)) {
//                     value.then(resolve, reason => {
//                         reasons.set(value, reason) && count === reasons.size && reject(
//                             new AggregateError(reasons, 'All promises were rejected'));
//                     })
//                 } else {
//                     resolve(value);
//                 }
//             }
//         });
//     }
//
//     static race<T>(values: Iterable<T | PromiseLike<T>>): Promise<Awaited<T>> {
//         return new this<any>((resolve, reject) => {
//             for (const value of values) {
//                 this.#isThenable(value) ? value.then(resolve, reject) : resolve(value)
//             }
//         });
//     }
//
//     static all<T extends readonly unknown[]>(values: T): Promise<{ -readonly [P in keyof T]: Awaited<T[P]> }> {
//         const [count, results] = [new Set(values).size, new Map<unknown, unknown>()];
//         return new this<any>((resolve, reject) => {
//             for (const value of values) {
//                 if (this.#isThenable(value)) {
//                     value.then(v => {
//                         results.set(value, v);
//                         if (count === results.size) {
//                             resolve([...values].map(key => results.get(key)));
//                         }
//                     }, reject);
//                 } else {
//                     results.set(value, value);
//                     count === results.size && resolve([...values].map(key => results.get(key)));
//                 }
//             }
//         });
//     }
//
//     static reject(reason?: any): Promise<never> {
//         return new this<never>((_resolve, reject) => reject(reason));
//     }
//
//     static resolve(): Promise<void>;
//     static resolve<T>(value: T | PromiseLike<T>): Promise<Awaited<T>>;
//     static resolve<T>(value?: T | PromiseLike<T>): Promise<Awaited<T>> {
//         return new this<Awaited<T>>(resolve => resolve(value as any));
//     }
//
//     static #isThenable<T>(value: any): value is PromiseLike<T> {
//         return 'object' === typeof value && null !== value && 'function' === typeof value.then;
//     }
//
//     #fulfill<TF = T>(value: Awaited<T>, reject: Promise.Reject, resolve: Promise.Resolve<TF>,
//                      onFulfilled?: Promise.Then<T, TF>) {
//         onFulfilled
//             ? setTimeout(() => {
//                 let next: TF | undefined | Awaited<TF> | PromiseLike<TF> = undefined;
//                 let error = false;
//
//                 try {
//                     next = onFulfilled(value);
//                 } catch (reason) {
//                     error = true;
//                     reject(reason);
//                 } finally {
//                     error || resolve(next!);
//                 }
//             })
//             : resolve(value as any);
//     }
//
//     #reject<TR = never>(reason: any, reject: Promise.Reject, resolve: Promise.Resolve<TR>,
//                         onRejected?: Promise.Catch<TR>) {
//         onRejected
//             ? setTimeout(() => {
//                 let next: TR | undefined | Awaited<TR> | PromiseLike<TR> = undefined;
//                 let error = false;
//
//                 try {
//                     next = onRejected(reason);
//                 } catch (reason) {
//                     error = true;
//                     reject(reason);
//                 } finally {
//                     error || resolve(next!);
//                 }
//             })
//             : reject(reason);
//     }
//
//     #finally(next: { value: any } | { reason: any },
//              reject: Promise.Reject, resolve: Promise.Resolve<T>, onFinally?: Promise.Finally) {
//         onFinally
//             ? setTimeout(() => {
//                 let error = false;
//
//                 try {
//                     onFinally();
//                 } catch (reason) {
//                     error = true;
//                     reject(reason);
//                 } finally {
//                     error || ('value' in next ? resolve(next.value) : reject(next.reason));
//                 }
//             })
//             : 'value' in next ? resolve(next.value) : reject(next.reason);
//     }
//
//     #settle(value: any, nextStatus: Status.REJECTED | Status.FULFILLED) {
//         if (Status.PENDING === this.#status) {
//             const IS_REJECTED = Status.REJECTED === nextStatus;
//
//             if (IS_REJECTED || !Promise.#isThenable(value)) {
//                 IS_REJECTED ? (this.#reason = value) : (this.#value = value);
//                 const listeners = {
//                     [Status.FULFILLED]: this.#fulfillListeners,
//                     [Status.REJECTED]: this.#rejectListeners,
//                 }[nextStatus];
//                 this.#status = nextStatus;
//
//                 for (const listener of listeners) {
//                     listener(value);
//                 }
//             } else if (Promise.#isThenable(value)) {
//                 this.#locked = true;
//                 value.then(
//                     v => this.#settle(v, Status.FULFILLED),
//                     r => this.#settle(r, Status.REJECTED));
//             }
//         }
//     }
//
//     #fromSpecies<T>(executor: Promise.Executor<T>): PromiseLike<Awaited<T>> {
//         const species: PromiseConstructorLike = (this.constructor as any)[Symbol.species] ?? OriginalPromise;
//         return Reflect.construct(species, [executor]) as any;
//     }
// }
//
// export namespace Promise {
//     export type Executor<T> = (resolve: Promise.Resolve<T>, reject: Promise.Reject) => void;
//     export type Then<T, U = T> = null | undefined | { (value: T): U | PromiseLike<U> };
//     export type Catch<N> = null | undefined | { (reason: any): N | PromiseLike<N> };
//     export type Resolve<T> = (value: T | PromiseLike<T>) => void;
//     export type Finally = null | undefined | { (): void };
//     export type Reject = (reason?: any) => void;
// }
//
// const enum Status {
//     FULFILLED = 'FULFILLED',
//     REJECTED = 'REJECTED',
//     PENDING = 'PENDING',
// }
//
// declare function setTimeout<P extends unknown[]>(code: (...args: P) => void, millis?: number, ...args: P): number;
