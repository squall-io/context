import {describe, expect, it, jest} from '@jest/globals';
import {Context, Promise as ContextPromise} from "../src";

const TestedPromise = ContextPromise;
const {fn} = jest;

describe('Promise', () => {
    describe('constructor( executor )', () => {
        it('execute executor immediately', () => {
            const resolver = fn();
            new TestedPromise(resolver);
            expect(resolver).toHaveBeenCalledTimes(1);
        });

        it('execute executor with two functions', () => {
            let resolve, reject;
            const resolver = fn((res, rej) => [resolve, reject] = [res, rej]);
            new TestedPromise(resolver);
            expect(reject).not.toBeUndefined();
            expect(resolve).not.toBeUndefined();
            expect(resolver).nthCalledWith(1, resolve, reject);
        });

        it('calling either function settles the promise', async () => {
            await expect(new TestedPromise(resolve => resolve(1))).resolves.toBe(1);
            await expect(new TestedPromise((_, reject) => reject(-1))).rejects.toBe(-1);
        });

        it('throw error when resolve is not a function', () => {
            expect(() => new TestedPromise(null as any)).toThrowError((thrown: any) =>
                thrown instanceof TypeError &&
                expect(thrown.message).toBe('Promise resolver null is not a function') || true);
            expect(() => new TestedPromise(undefined as any)).toThrowError((thrown: any) =>
                thrown instanceof TypeError &&
                expect(thrown.message).toBe('Promise resolver undefined is not a function') || true);
            expect(() => new TestedPromise([] as any)).toThrowError((thrown: any) =>
                thrown instanceof TypeError &&
                expect(thrown.message).toBe('Promise resolver [object Array] is not a function') || true);
        });

        it('result in a reject promise when executor throw error', async () => {
            const error = new Error('AAA');
            // @formatter:off
            await expect(new TestedPromise(() => { throw error; })).rejects.toBe(error);
            // @formatter:on
        });
    });

    describe('.then( onResolved?, onRejected? )', () => {
        it('asynchronously call the onResolved callback', async () => {
            const onResolved = fn();
            const next = new TestedPromise(resolve => resolve(1)).then(onResolved);
            expect(onResolved).toHaveBeenCalledTimes(0);
            await next;
            expect(onResolved).toHaveBeenCalledTimes(1);
        });

        it('asynchronously call the onResolved callback with resolved value', async () => {
            const onResolved = fn();
            const next = new TestedPromise(resolve => resolve(1)).then(onResolved);
            expect(onResolved).toHaveBeenCalledTimes(0);
            await next;
            expect(onResolved).nthCalledWith(1, 1);
        });

        it('asynchronously call the onRejected callback', async () => {
            const onRejected = fn();
            const next = new TestedPromise((_, reject) => reject(-1)).then(null, onRejected);
            expect(onRejected).toHaveBeenCalledTimes(0);
            await next;
            expect(onRejected).toHaveBeenCalledTimes(1);
        });

        it('asynchronously call the onRejected callback with rejection reason', async () => {
            const onRejected = fn();
            const next = new TestedPromise((_, reject) => reject(-1)).then(null, onRejected);
            expect(onRejected).toHaveBeenCalledTimes(0);
            await next;
            expect(onRejected).nthCalledWith(1, -1);
        });

        it('ignore (no error) callback when null or undefined', async () => {
            await new TestedPromise(resolve => resolve(1)).then(null, null);
            await new TestedPromise(resolve => resolve(1)).then(null, undefined);
            await new TestedPromise(resolve => resolve(1)).then(undefined, null);
            await new TestedPromise(resolve => resolve(1)).then(undefined, undefined);
            await new TestedPromise((_, reject) => reject(-1)).then(null, null).catch(_ => _);
            await new TestedPromise((_, reject) => reject(-1)).then(null, undefined).catch(_ => _);
            await new TestedPromise((_, reject) => reject(-1)).then(undefined, null).catch(_ => _);
            await new TestedPromise((_, reject) => reject(-1)).then(undefined, undefined).catch(_ => _);
        });

        it('call at most one of the callbacks but never both', async () => {
            let [onResolved, onRejected] = [fn(), fn()];
            new TestedPromise(_ => _).then(onResolved, onRejected);
            expect(onResolved).toHaveBeenCalledTimes(0);
            expect(onRejected).toHaveBeenCalledTimes(0);
            await new TestedPromise(resolve => setTimeout(resolve));
            expect(onResolved).toHaveBeenCalledTimes(0);
            expect(onRejected).toHaveBeenCalledTimes(0);

            [onResolved, onRejected] = [fn(), fn()];
            let promise = new TestedPromise(res => res(1)).then(onResolved, onRejected);
            expect(onResolved).toHaveBeenCalledTimes(0);
            expect(onRejected).toHaveBeenCalledTimes(0);
            await promise;
            expect(onResolved).toHaveBeenCalledTimes(1);
            expect(onResolved).nthCalledWith(1, 1);
            expect(onRejected).toHaveBeenCalledTimes(0);

            [onResolved, onRejected] = [fn(), fn()];
            promise = new TestedPromise((_, rej) => rej(-1)).then(onResolved, onRejected);
            expect(onResolved).toHaveBeenCalledTimes(0);
            expect(onRejected).toHaveBeenCalledTimes(0);
            await promise;
            expect(onResolved).toHaveBeenCalledTimes(0);
            expect(onRejected).toHaveBeenCalledTimes(1);
            expect(onRejected).nthCalledWith(1, -1);
        });

        it('return a promise, resolved to either callback awaited return value', async () => {
            await expect(new TestedPromise(res => res(1))
                .then(_ => 2, _ => -2)
            ).resolves.toBe(2);
            await expect(new TestedPromise(res => res(1))
                .then(_ => new TestedPromise(res => res(2)), _ => -3)
            ).resolves.toBe(2);
            await expect(new TestedPromise(res => res(1))
                .then(_ => new TestedPromise((_, rej) => rej(-2)), _ => -3)
            ).rejects.toBe(-2);

            await expect(new TestedPromise((_, rej) => rej(-1))
                .then(_ => 2, _ => 3)
            ).resolves.toBe(3);
            await expect(new TestedPromise((_, rej) => rej(-1))
                .then(_ => 2, _ => new TestedPromise(res => res(3)))
            ).resolves.toBe(3);
            await expect(new TestedPromise((_, rej) => rej(-1))
                .then(_ => 2, _ => new TestedPromise((_, rej) => rej(-3)))
            ).rejects.toBe(-3);
        });

        it('return a promise, rejected to either callback thrown error', async () => {
            // @formatter:off
            const [rs, rj] = [new Error('RS'), new Error('RJ')];
            await expect(new TestedPromise(res => res(1))
                .then(_ => {throw rs;}, _ => {throw rj;}))
                .rejects.toBe(rs);
            await expect(new TestedPromise((_, rej) => rej(-1))
                .then(_ => {throw rs;}, _ => {throw rj;}))
                .rejects.toBe(rj);
            // @formatter:on
        });

        it('propagate state on missing onResolved callback', async () => {
            await expect(new TestedPromise(res => res(1)).then())
                .resolves.toBe(1);
            await expect(new TestedPromise(res => res(1)).then(null))
                .resolves.toBe(1);
            await expect(new TestedPromise(res => res(1)).then(undefined))
                .resolves.toBe(1);
            await expect(new TestedPromise(res => res(1)).then(null, _ => _))
                .resolves.toBe(1);
            await expect(new TestedPromise(res => res(1)).then(undefined, _ => _))
                .resolves.toBe(1);
        });

        it('propagate state on missing onRejected callback', async () => {
            await expect(new TestedPromise((_, rej) => rej(-1)).then())
                .rejects.toBe(-1);
            await expect(new TestedPromise((_, rej) => rej(-1)).then(null))
                .rejects.toBe(-1);
            await expect(new TestedPromise((_, rej) => rej(-1)).then(undefined))
                .rejects.toBe(-1);
            await expect(new TestedPromise((_, rej) => rej(-1)).then(null, null))
                .rejects.toBe(-1);
            await expect(new TestedPromise((_, rej) => rej(-1)).then(null, undefined))
                .rejects.toBe(-1);
            await expect(new TestedPromise((_, rej) => rej(-1)).then(undefined, null))
                .rejects.toBe(-1);
            await expect(new TestedPromise((_, rej) => rej(-1)).then(undefined, undefined))
                .rejects.toBe(-1);
            await expect(new TestedPromise((_, rej) => rej(-1)).then(_ => _))
                .rejects.toBe(-1);
            await expect(new TestedPromise((_, rej) => rej(-1)).then(_ => _))
                .rejects.toBe(-1);
            await expect(new TestedPromise((_, rej) => rej(-1)).then(_ => _, null))
                .rejects.toBe(-1);
            await expect(new TestedPromise((_, rej) => rej(-1)).then(_ => _, undefined))
                .rejects.toBe(-1);
        });

        it('return a different promise even when given no parameter', () => {
            const promise = new TestedPromise(_ => _);
            expect(promise.then()).not.toBe(promise);
        });
    });

    describe('.catch( onRejected? )', () => {
        it('asynchronously call the onRejected callback', async () => {
            const onRejected = fn();
            const next = new TestedPromise((_, reject) => reject(-1)).catch(onRejected);
            expect(onRejected).toHaveBeenCalledTimes(0);
            await next;
            expect(onRejected).toHaveBeenCalledTimes(1);
        });

        it('asynchronously call the onRejected callback with rejection reason', async () => {
            const onRejected = fn();
            const next = new TestedPromise((_, reject) => reject(-1)).catch(onRejected);
            expect(onRejected).toHaveBeenCalledTimes(0);
            await next;
            expect(onRejected).nthCalledWith(1, -1);
        });

        it('ignore (no error) callback when null or undefined', async () => {
            await new TestedPromise(resolve => resolve(1)).catch();
            await new TestedPromise(resolve => resolve(1)).catch(null);
            await new TestedPromise(resolve => resolve(1)).catch(undefined);
            await expect(new TestedPromise((_, reject) => reject(-1)).catch())
                .rejects.toBe(-1);
            await expect(new TestedPromise((_, reject) => reject(-1)).catch(null))
                .rejects.toBe(-1);
            await expect(new TestedPromise((_, reject) => reject(-1)).catch(undefined))
                .rejects.toBe(-1);
        });

        it('return a promise, resolved to callback awaited return value', async () => {
            await expect(new TestedPromise((_, rej) => rej(-1))
                .catch(_ => 2)
            ).resolves.toBe(2);
            await expect(new TestedPromise((_, rej) => rej(-1))
                .catch(_ => new TestedPromise(res => res(2)))
            ).resolves.toBe(2);
            await expect(new TestedPromise((_, rej) => rej(-1))
                .catch(_ => new TestedPromise((_, rej) => rej(-2)))
            ).rejects.toBe(-2);
        });

        it('return a promise, rejected to callback thrown error', async () => {
            // @formatter:off
            const rj = new Error('RJ');
            await expect(new TestedPromise((_, rej) => rej(-1))
                .catch(_ => {throw rj;})
            ).rejects.toBe(rj);
            // @formatter:on
        });

        it('propagate state on missing onRejected callback', async () => {
            await expect(new TestedPromise((_, rej) => rej(-1)).catch())
                .rejects.toBe(-1);
            await expect(new TestedPromise((_, rej) => rej(-1)).catch(null))
                .rejects.toBe(-1);
            await expect(new TestedPromise((_, rej) => rej(-1)).catch(undefined))
                .rejects.toBe(-1);
        });

        it('return a different promise even when given no parameter', () => {
            const promise = new TestedPromise(_ => _);
            expect(promise.catch()).not.toBe(promise);
        });
    });

    describe('.finally( onSettled )', () => {
        it('do not execute callback as soon as the promise is resolved', async () => {
            const onSettled = fn();
            const promise = new TestedPromise(res => res(1));
            promise.finally(onSettled);

            expect(onSettled).toHaveBeenCalledTimes(0);
            await expect(promise).resolves.toBe(1);
        });

        it('execute callback once asynchronously after the promise is resolved', async () => {
            const onSettled = fn();
            const promise = new TestedPromise(res => res(1));
            promise.finally(onSettled);
            await promise;

            expect(onSettled).toHaveBeenCalledTimes(1);
            await expect(promise).resolves.toBe(1);
        });

        it('execute callback without parameters after the promise is resolved', async () => {
            const onSettled = fn();
            const promise = new TestedPromise(res => res(1));
            promise.finally(onSettled);
            await promise;

            expect(onSettled).nthCalledWith(1);
            await expect(promise).resolves.toBe(1);
        });

        it('do not execute callback as soon as the promise is rejected', async () => {
            const onSettled = fn();
            const promise = new TestedPromise((_, rej) => rej(-1));
            const finalized = promise.finally(onSettled);

            expect(onSettled).toHaveBeenCalledTimes(0);
            await expect(finalized).rejects.toBe(-1);
        });

        it('execute callback once asynchronously after the promise is rejected', async () => {
            const onSettled = fn();
            const promise = new TestedPromise((_, rej) => rej(-1));
            const finalized = promise.finally(onSettled);

            await new TestedPromise(res => res(1));
            expect(onSettled).toHaveBeenCalledTimes(1);
            await expect(finalized).rejects.toBe(-1);
        });

        it('execute callback without parameters after the promise is resolved', async () => {
            const onSettled = fn();
            const promise = new TestedPromise((_, rej) => rej(-1));
            const finalized = promise.finally(onSettled);

            await new TestedPromise(res => res(1));
            expect(onSettled).nthCalledWith(1);
            await expect(finalized).rejects.toBe(-1);
        });

        it('propagate stage with null/undefined or without callback', async () => {
            await expect(new TestedPromise(res => res(1)).finally())
                .resolves.toBe(1);
            await expect(new TestedPromise(res => res(1)).finally(null))
                .resolves.toBe(1);
            await expect(new TestedPromise(res => res(1)).finally(undefined))
                .resolves.toBe(1);

            await expect(new TestedPromise((_, rej) => rej(-1)).finally())
                .rejects.toBe(-1);
            await expect(new TestedPromise((_, rej) => rej(-1)).finally(null))
                .rejects.toBe(-1);
            await expect(new TestedPromise((_, rej) => rej(-1)).finally(undefined))
                .rejects.toBe(-1);
        });

        it('return a different promise [even] when no callbacks', () => {
            const promise = new TestedPromise(res => res(1));
            expect(promise.finally()).not.toBe(promise);
        });
    });

    describe('.[@@toStringTag]', () => {
        it('get the class name of the promise class', () => {
            class ExtendedPromise<T> extends TestedPromise<T> {
            }

            expect(new TestedPromise(fn())[Symbol.toStringTag]).toBe(TestedPromise.name);
            expect(new ExtendedPromise(fn())[Symbol.toStringTag]).toBe(TestedPromise.name);
        });

        it('get the class name of the promise class unless overriden', () => {
            class ExtendedPromise<T> extends TestedPromise<T> {
                get [Symbol.toStringTag](): string {
                    return ExtendedPromise.name;
                }
            }

            expect(new TestedPromise(fn())[Symbol.toStringTag]).toBe(TestedPromise.name);
            expect(new ExtendedPromise(fn())[Symbol.toStringTag]).toBe(ExtendedPromise.name);
        });
    });

    describe('get context()', () => {
        it('resolve to a thenable', () => {
            expect(new TestedPromise(_ => _).context).toBeInstanceOf(Object);
            expect(new TestedPromise(_ => _).context).toHaveProperty('then');
            expect(new TestedPromise(_ => _).context.then).toBeInstanceOf(Function);
        });

        it('resolve to a thenable that return a promise as well', () => {
            expect(new TestedPromise(_ => _).context.then()).toBeInstanceOf(TestedPromise);
        });

        it('resolve to a thenable that resolves with a tuple: [value, context?]', async () => {
            const context = new Context();
            const withContext = await (TestedPromise.resolve(1, context).context);
            expect(withContext).toHaveLength(2);
            expect(withContext[0]).toBe(1);
            expect(withContext[1]).toBe(context);

            const withoutContext = await (TestedPromise.resolve(1).context);
            expect(withoutContext).toHaveLength(1);
            expect(withoutContext[0]).toBe(1);
        });

        it('resolve to a thenable that rejects with a tuple: [reason, context?]', async () => {
            const context = new Context();
            try {
                await (TestedPromise.reject(-1, context).context);
                // noinspection ExceptionCaughtLocallyJS
                throw new Error('Should not get down here');
            } catch (withContext) {
                expect(withContext).toHaveLength(2);
                expect((withContext as any[])[0]).toBe(-1);
                expect((withContext as any[])[1]).toBe(context);
            }

            try {
                await (TestedPromise.reject(-1).context);
                // noinspection ExceptionCaughtLocallyJS
                throw new Error('Should not get down here');
            } catch (withoutContext) {
                expect(withoutContext).toHaveLength(1);
                expect((withoutContext as any[])[0]).toBe(-1);
            }
        });
    });

    describe('::[@@species]', () => {
        class NewPromise<T> extends TestedPromise<T> {
        }

        class UnstablePromise<T> extends TestedPromise<T> {
            static get [Symbol.species]() {
                return NewPromise;
            }
        }

        class AwkwardPromise<T> extends TestedPromise<T> {
            static get [Symbol.species]() {
                return undefined as any;
            }
        }

        class BackwardPromise<T> extends TestedPromise<T> {
            static get [Symbol.species]() {
                return undefined as any;
            }
        }

        it('is honoured by .then', () => {
            expect(new UnstablePromise(res => res(1)).then())
                .toBeInstanceOf(NewPromise);
            expect(new AwkwardPromise(res => res(1)).then())
                .toBeInstanceOf(TestedPromise);
            expect(new BackwardPromise(res => res(1)).then())
                .toBeInstanceOf(TestedPromise);
        });

        it('is honoured by .catch', () => {
            expect(cached(new UnstablePromise((_, rej) => rej(-1)).catch()))
                .toBeInstanceOf(NewPromise);
            cached.silenced();
            expect(cached(new AwkwardPromise((_, rej) => rej(-1)).catch()))
                .toBeInstanceOf(TestedPromise);
            cached.silenced();
            expect(cached(new BackwardPromise((_, rej) => rej(-1)).catch()))
                .toBeInstanceOf(TestedPromise);
            cached.silenced();
        });

        it('is honoured by .finally', () => {
            expect(cached(new UnstablePromise((_, rej) => rej(-1)).finally()))
                .toBeInstanceOf(NewPromise);
            cached.silenced();
            expect(cached(new AwkwardPromise((_, rej) => rej(-1)).finally()))
                .toBeInstanceOf(TestedPromise);
            cached.silenced();
            expect(cached(new BackwardPromise((_, rej) => rej(-1)).finally()))
                .toBeInstanceOf(TestedPromise);
            cached.silenced();
        });
    });

    describe('::reject( reason? )', () => {
        it('return a promise that rejects with the given reason', async () => {
            await expect(TestedPromise.reject(-1)).rejects.toBe(-1);
            await expect(TestedPromise.reject()).rejects.toBe(undefined);

            const reason = cached(TestedPromise.reject(-1));
            cached.silenced();
            await expect(TestedPromise.reject(reason)).rejects.toBe(reason);
        });
    });

    describe('::resolve( value? )', () => {
        it('return a promise that resolves with the given value', async () => {
            await expect(TestedPromise.resolve(1)).resolves.toBe(1);
            await expect(TestedPromise.resolve()).resolves.toBe(undefined);
        });

        it('return a promise that resolves with the awaited given value', async () => {
            await expect(TestedPromise.resolve(TestedPromise.resolve(1))).resolves.toBe(1);
        });

        it('return a promise that rejects with the awaited given reject-promise', async () => {
            await expect(TestedPromise.resolve(TestedPromise.reject(-1))).rejects.toBe(-1);
        });
    });

    describe('::all( sources )', () => {
        it('resolve with an array of awaited values when all resolve', async () => {
            await expect(TestedPromise.all([])).resolves.toStrictEqual([]);
            await expect(TestedPromise.all([
                0,
                TestedPromise.resolve(2),
                new TestedPromise(res => setTimeout(res, 1, 1))
            ])).resolves.toStrictEqual([0, 2, 1]);
        });

        it('reject when any of the given value is a promise that rejected, with that rejection reason', async () => {
            await expect(TestedPromise.all([
                0,
                TestedPromise.resolve(2),
                new TestedPromise((_, rej) => setTimeout(rej, 1, -1))
            ])).rejects.toBe(-1);
        });

        it('when rejecting, reject with the first reject chronology-wise', async () => {
            await expect(TestedPromise.all([
                0,
                TestedPromise.resolve(2),
                new TestedPromise((_, rej) => setTimeout(rej, 9, -1)),
                new TestedPromise((_, rej) => setTimeout(rej, 1, -2))
            ])).rejects.toBe(-2);
        });
    });

    describe('::any( sources )', () => {
        it('resolve if any of the given sources resolves, with that source resolve value', async () => {
            await expect(TestedPromise.any([
                new TestedPromise((_, rej) => setTimeout(rej, 3, -3)),
                new TestedPromise((_, rej) => setTimeout(rej, 2, -2)),
                new TestedPromise((_, rej) => setTimeout(rej, 1, -1)),
                1,
            ])).resolves.toBe(1);
            await expect(TestedPromise.any([
                new TestedPromise((_, rej) => setTimeout(rej, 3, -3)),
                new TestedPromise((_, rej) => setTimeout(rej, 2, -2)),
                new TestedPromise((_, rej) => setTimeout(rej, 1, -1)),
                new TestedPromise(res => res(1)),
            ])).resolves.toBe(1);
        });

        it('resolve if any of the given sources resolves, with that first source resolve value', async () => {
            await expect(TestedPromise.any([
                new TestedPromise((_, rej) => setTimeout(rej, 3, -3)),
                new TestedPromise((_, rej) => setTimeout(rej, 2, -2)),
                new TestedPromise((_, rej) => setTimeout(rej, 1, -1)),
                new TestedPromise(res => setTimeout(res, 1, 1)),
                2,
            ])).resolves.toBe(2);
            await expect(TestedPromise.any([
                new TestedPromise((_, rej) => setTimeout(rej, 30, -3)),
                new TestedPromise((_, rej) => setTimeout(rej, 20, -2)),
                new TestedPromise((_, rej) => setTimeout(rej, 10, -1)),
                new TestedPromise(res => setTimeout(res, 20, 2)),
                new TestedPromise(res => setTimeout(res, 10, 1)),
            ])).resolves.toBe(1);
        });

        it('reject with aggregate error when none of its sources resolved', async () => {
            await expect(TestedPromise.any([
                new TestedPromise((_, rej) => setTimeout(rej, 3, -3)),
                new TestedPromise((_, rej) => setTimeout(rej, 2, -2)),
                new TestedPromise((_, rej) => setTimeout(rej, 1, -1)),
            ]).catch((error: AggregateError) => {
                expect(error.errors).toEqual([-3, -2, -1]);
                throw error;
            })).rejects.toEqual(new AggregateError([], 'All promises were rejected'));
            await expect(TestedPromise.any([]).catch((error: AggregateError) => {
                expect(error.errors).toEqual([]);
                throw error;
            })).rejects.toEqual(new AggregateError([], 'All promises were rejected'));
        });
    });

    describe('::race( sources )', () => {
        it('settle as the first source that settled', async () => {
            await expect(TestedPromise.race([
                new TestedPromise(res => setTimeout(res, 0, 1)),
                2,
            ])).resolves.toBe(2);
            await expect(TestedPromise.race([
                new TestedPromise(res => setTimeout(res, 20, 2)),
                new TestedPromise(res => setTimeout(res, 10, 1)),
            ])).resolves.toBe(1);
            await expect(TestedPromise.race([
                new TestedPromise((_, rej) => setTimeout(rej, 0, -1)),
                new TestedPromise(res => setTimeout(res, 10, 1)),
            ])).rejects.toBe(-1);
        });

        it('never settle if sources is empty', async () => {
            const onFinally = fn();
            TestedPromise.race([]).finally(onFinally);
            await new TestedPromise(res => setTimeout(res, 10, 1));
            expect(onFinally).not.toHaveBeenCalled();
        });
    });

    describe('::allSettled( sources )', () => {
        it('resolve when all sources settle, with an aggregate', async () => {
            await expect(TestedPromise.allSettled([
                TestedPromise.reject(-1),
                0,
                TestedPromise.resolve(1),
            ])).resolves.toEqual([
                {status: 'rejected', reason: -1},
                {status: 'fulfilled', value: 0},
                {status: 'fulfilled', value: 1},
            ]);
            await expect(TestedPromise.allSettled([]))
                .resolves.toEqual([]);
        });

        it('never settle if some sources never settle', async () => {
            const onFinally = fn();
            TestedPromise.allSettled([TestedPromise.race([])]).finally(onFinally);
            await new TestedPromise(res => setTimeout(res, 10, 1));
            expect(onFinally).not.toHaveBeenCalled();
        });
    });

    describe('with context', () => {
        describe('constructor(...)', () => {
            it('propagate its context along rejection callback when executor throw', async () => {
                const [onRejected, context, error] = [fn(), new Context(), new Error('BBB')];
                await new TestedPromise(() => {
                    throw error;
                }, context).catch(onRejected);
                expect(onRejected).nthCalledWith(1, error, context);
            });

            it('executor resolve override constructor context if non-undefined', async () => {
                let [onFulfilled, onRejected, onFinally, context] = [fn(), fn(), fn(), new Context()];
                await new TestedPromise(res => res(1, undefined), context)
                    .finally(onFinally).then(onFulfilled, onRejected);
                expect(onFulfilled).nthCalledWith(1, 1, context);
                expect(onFinally).nthCalledWith(1, context);
                expect(onRejected).not.toHaveBeenCalled();

                [onFulfilled, onRejected, onFinally, context] = [fn(), fn(), fn(), new Context()];
                await new TestedPromise(res => res(1, context), new Context())
                    .finally(onFinally).then(onFulfilled, onRejected);
                expect(onFulfilled).nthCalledWith(1, 1, context);
                expect(onFinally).nthCalledWith(1, context);
                expect(onRejected).not.toHaveBeenCalled();
            });

            it('executor reject override constructor context if non-undefined', async () => {
                let [onFulfilled, onRejected, onFinally, context] = [fn(), fn(), fn(), new Context()];
                await new TestedPromise((_, rej) => rej(-1, undefined), context)
                    .finally(onFinally).then(onFulfilled, onRejected);
                expect(onRejected).nthCalledWith(1, -1, context);
                expect(onFinally).nthCalledWith(1, context);
                expect(onFulfilled).not.toHaveBeenCalled();

                [onFulfilled, onRejected, onFinally, context] = [fn(), fn(), fn(), new Context()];
                await new TestedPromise((_, rej) => rej(-1, context), new Context())
                    .finally(onFinally).then(onFulfilled, onRejected);
                expect(onRejected).nthCalledWith(1, -1, context);
                expect(onFinally).nthCalledWith(1, context);
                expect(onFulfilled).not.toHaveBeenCalled();
            });
        });
    });
});

const cached: {
    silenced(): void;
    promise?: PromiseLike<any>;
    <P extends PromiseLike<any>>(promise: P): P;
    andSilencedAtOnce<P extends PromiseLike<any>>(promise: P): P;
} = <P extends PromiseLike<any>>(promise: P) => cached.promise = promise;
cached.andSilencedAtOnce = <P extends PromiseLike<any>>(promise: P): P => {
    cached(promise).then(null, _ => _);
    return promise;
}
cached.silenced = () => cached.promise?.then(null, _ => _);
