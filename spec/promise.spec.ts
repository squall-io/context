import {describe, expect, it, jest} from '@jest/globals';
// @ts-ignore
const [TestedPromise, NativePromise] = [Promise, Promise];
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
    });

    describe('.then( onResolved?, onRejected? )', () => {
        it('noop', () => {
        });
    });

    describe('.catch( onRejected? )', () => {
        it('noop', () => {
        });
    });

    describe('.finally( onSettled )', () => {
        it('noop', () => {
        });
    });

    describe('.[@@toStringTag]', () => {
        it('noop', () => {
        });
    });

    describe('.[@@species]', () => {
        it('noop', () => {
        });
    });

    describe('::reject( reason )', () => {
        it('noop', () => {
        });
    });

    describe('::resolve( value )', () => {
        it('noop', () => {
        });
    });

    describe('::all( sources )', () => {
        it('noop', () => {
        });
    });

    describe('::any( sources )', () => {
        it('noop', () => {
        });
    });

    describe('::race( sources )', () => {
        it('noop', () => {
        });
    });

    describe('::allSettled( sources )', () => {
        it('noop', () => {
        });
    });
});

// declare function setTimeout(code: (...args: any[]) => void, delayMilliseconds?: number, ...parameters: any[]): number;
