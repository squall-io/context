import createSpy = jasmine.createSpy;

describe('Promise', () => {
    describe('.new( resolver )', () => {
        it('resolves when resolve callback is called first', async () => {
            const resolveSpy = createSpy('resolveSpy', value => res(value)).and.callThrough();
            const rejectSpy = createSpy('rejectSpy', reason => rej(reason)).and.callThrough();
            let res: (value: unknown) => void;
            let rej: (value: any) => void;
            const promise = new Promise((resolve, reject) => {
                [res, rej] = [resolve, reject];

                resolveSpy(1);
                rejectSpy(-1);
            });

            expect(resolveSpy).toHaveBeenCalledOnceWith(1);
            expect(rejectSpy).toHaveBeenCalledOnceWith(-1);
            await expectAsync(promise).toBeResolvedTo(1);
        });

        it('rejects when reject callback is called first', async () => {
            const resolveSpy = createSpy('resolveSpy', value => res(value)).and.callThrough();
            const rejectSpy = createSpy('rejectSpy', reason => rej(reason)).and.callThrough();
            let res: (value: unknown) => void;
            let rej: (value: any) => void;
            const promise = new Promise((resolve, reject) => {
                [res, rej] = [resolve, reject];

                rejectSpy(-1);
                resolveSpy(1);
            });

            expect(resolveSpy).toHaveBeenCalledOnceWith(1);
            expect(rejectSpy).toHaveBeenCalledOnceWith(-1);
            await expectAsync(promise).toBeRejectedWith(-1);
        });

        it('throws is resolver is not a function', async () => {
            // @ts-ignore
            expect(() => new Promise()).toThrowError(
                TypeError, 'Promise resolver undefined is not a function');
            // @ts-ignore
            expect(() => new Promise(null)).toThrowError(
                TypeError, 'Promise resolver null is not a function');
            // @ts-ignore
            expect(() => new Promise(undefined)).toThrowError(
                TypeError, 'Promise resolver undefined is not a function');
            // @ts-ignore
            expect(() => new Promise([])).toThrowError(
                TypeError, 'Promise resolver [object Array] is not a function');
        });

        it('returns a rejected promise if resolver throws an exception', async () => {
            await expectAsync(new Promise(() => {
                throw new Error('A.A');
            })).toBeRejectedWith(new Error('A.A'));
        });
    });

    describe('.any( [...promises] )', () => {
        it('resolves when any of the promises resolve', async () => {
            const all = Promise.any([
                new Promise<'0'>(resolve => resolve('0')),
                Promise.reject(1),
            ]);

            await expectAsync(all).toBeResolvedTo('0');
        });

        it('reject when all of the promises reject with aggregate reason', async () => {
            const all = Promise.any([
                new Promise<never>((_resolve, reject) => reject('0')),
                Promise.reject(1),
            ]);

            await expectAsync(all).toBeRejectedWith(
                new AggregateError(['0', 1], 'All promises were rejected'));
        });
    });

    describe('.all( [...promises] )', () => {
        it('resolves when all promises resolve', async () => {
            const all = Promise.all([
                Promise.resolve('0' as const),
                Promise.resolve(1 as const),
            ]);

            await expectAsync(all).toBeResolvedTo(['0', 1]);

            const resolved = await all;
            expect(resolved).toBeInstanceOf(Array);

            const lazyIterator = resolved[Symbol.iterator]();
            expect(lazyIterator).not.toBeNull();
            expect(lazyIterator).not.toBeUndefined();
            expect(lazyIterator.next()).toEqual({value: '0', done: false});
            expect(lazyIterator.next()).toEqual({value: 1, done: false});
            expect(lazyIterator.next()).toEqual({value: undefined, done: true});
        });

        it('rejects when the any promise rejects, with the first rejection reason', async () => {
            const all = Promise.all([
                Promise.resolve('0'),
                Promise.resolve(1 as const),
                new Promise((_resolve, reject) => {
                    setTimeout(() => reject('2' as const));
                }),
                Promise.reject('3' as const),
            ]);

            await expectAsync(all).toBeRejectedWith('3');
        });
    });

    describe('.race( [...promises] )', () => {
        it('returns a promise that settles as the first promise to settle', async () => {
            await expectAsync(Promise.race([
                Promise.resolve(1),
                Promise.reject(-1),
            ])).toBeResolvedTo(1);
            await expectAsync(Promise.race([
                Promise.reject(-1),
                Promise.resolve(1),
            ])).toBeRejectedWith(-1);
        });
    });

    describe('.reject( reason )', () => {
        it('returns a rejected promise with the given reason', async () => {
            await expectAsync(Promise.reject()).toBeRejectedWith(undefined);
            await expectAsync(Promise.reject(-1)).toBeRejectedWith(-1);
        });
    });

    describe('.resolve( value )', () => {
        it('returns a resolved promise with the given value', async () => {
            const resolvedVoid = Promise.resolve();
            await expectAsync(resolvedVoid).toBeResolvedTo(undefined);
            expect(resolvedVoid[Symbol.toStringTag]).toBe('Promise');
            const resolvedOne = Promise.resolve(1);
            await expectAsync(resolvedOne).toBeResolvedTo(1);
            expect(resolvedOne[Symbol.toStringTag]).toBe('Promise');
        });
    });

    describe('.allSettled( [...promises] )', () => {
        it('resolves when all promises settle', async () => {
            const allSettled = Promise.allSettled([
                -1,
                Promise.resolve('0' as const),
                Promise.resolve(1 as const),
                Promise.reject('2' as const),
            ]);

            expect(allSettled[Symbol.toStringTag]).toBe('Promise');
            await expectAsync(allSettled).toBeResolvedTo([
                {status: 'fulfilled', value: -1},
                {status: 'fulfilled', value: '0'},
                {status: 'fulfilled', value: 1},
                {status: 'rejected', reason: '2'},
            ]);

            const resolved = await allSettled;
            expect(resolved).toBeInstanceOf(Array);

            const lazyIterator = resolved[Symbol.iterator]();
            expect(lazyIterator).not.toBeNull();
            expect(lazyIterator).not.toBeUndefined();
            expect(lazyIterator.next()).toEqual({value: {status: 'fulfilled', value: -1}, done: false});
            expect(lazyIterator.next()).toEqual({value: {status: 'fulfilled', value: '0'}, done: false});
            expect(lazyIterator.next()).toEqual({value: {status: 'fulfilled', value: 1}, done: false});
            expect(lazyIterator.next()).toEqual({value: {status: 'rejected', reason: '2'}, done: false});
            expect(lazyIterator.next()).toEqual({value: undefined, done: true});
        });
    });

    describe('promise.then( transform )', () => {
        it('should call given transform in the next tick of the event loop', async () => {
            const resolveSpy = createSpy('resolveSpy');
            const next = Promise.resolve(1).then(resolveSpy);
            expect(resolveSpy).not.toHaveBeenCalled();
            await next;
            expect(resolveSpy).toHaveBeenCalledOnceWith(1);
        });

        it('should return a resolved promise with returned value from the transform', async () => {
            await expectAsync(Promise.resolve(1).then(() => 2)).toBeResolvedTo(2);
        });

        it('should return a promise that settles as the one returned by the transform', async () => {
            await expectAsync(Promise.resolve(1)
                .then(() => Promise.resolve(2))).toBeResolvedTo(2);
            await expectAsync(Promise.resolve(1)
                .then(() => Promise.reject(-2))).toBeRejectedWith(-2);
        });
    });

    describe('promise.catch( transform )', () => {
        it('should call given transform in the next tick of the event loop', async () => {
            const rejectSpy = createSpy('rejectSpy');
            const next = Promise.reject(-1).catch(rejectSpy);
            expect(rejectSpy).not.toHaveBeenCalled();
            await next;
            expect(rejectSpy).toHaveBeenCalledOnceWith(-1);
        });

        it('should return a resolved promise with returned value from the transform', async () => {
            await expectAsync(Promise.reject(-1).catch(() => 2)).toBeResolvedTo(2);
        });

        it('should return a promise that settles as the one returned by the transform', async () => {
            await expectAsync(Promise.reject(-1)
                .catch(() => Promise.resolve(2))).toBeResolvedTo(2);
            await expectAsync(Promise.reject(-1)
                .catch(() => Promise.reject(-2))).toBeRejectedWith(-2);
        });
    });

    describe('promise.finally(...)', () => {
        const getFinallySpy = () => finallySpy = createSpy('finallySpy');
        let finallySpy: jasmine.Spy<jasmine.Func>;
        beforeEach(() => getFinallySpy());

        it('gets called without parameters, when the promise resolves', async () => {
            Promise.resolve(1).finally(finallySpy);
            expect(finallySpy).not.toHaveBeenCalled();
            await Promise.resolve(1).finally(getFinallySpy());
            expect(finallySpy).toHaveBeenCalledOnceWith();
        });

        it('gets called without parameters, when the promise rejects', async () => {
            const rejected = Promise.reject(-1).finally(finallySpy);
            expect(finallySpy).not.toHaveBeenCalled();
            await expectAsync(rejected).toBeRejectedWith(-1);
            expect(finallySpy).toHaveBeenCalledOnceWith();
        });
    });
});

declare function setTimeout(code: (...args: any[]) => void, delayMilliseconds?: number, ...parameters: any[]): number;
