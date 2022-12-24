import createSpy = jasmine.createSpy;

const P = Promise;

describe('Promise', () => {
    describe('.new( resolver )', () => {
        it('resolves when resolve callback is called first', async () => {
            const resolveSpy = createSpy('resolveSpy', value => res(value)).and.callThrough();
            const rejectSpy = createSpy('rejectSpy', reason => rej(reason)).and.callThrough();
            let res: (value: unknown) => void;
            let rej: (value: any) => void;
            const promise = new P((resolve, reject) => {
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
            const promise = new P((resolve, reject) => {
                [res, rej] = [resolve, reject];

                rejectSpy(-1);
                resolveSpy(1);
            });

            expect(resolveSpy).toHaveBeenCalledOnceWith(1);
            expect(rejectSpy).toHaveBeenCalledOnceWith(-1);
            await expectAsync(promise).toBeRejectedWith(-1);
        });

        it('throws if resolver is not a function', async () => {
            // @ts-ignore: TS2554: Expected 1 arguments, but got 0.
            expect(() => new P()).toThrowError(
                TypeError, 'Promise resolver undefined is not a function');
            // @ts-ignore: TS2345: Argument of type 'null' is not assignable to parameter of type
            //             '(resolve: Resolve , reject: Reject) => void'.
            expect(() => new P(null)).toThrowError(
                TypeError, 'Promise resolver null is not a function');
            // @ts-ignore: TS2345: Argument of type 'undefined' is not assignable to parameter of type
            //             '(resolve: Resolve , reject: Reject) => void'.
            expect(() => new P(undefined)).toThrowError(
                TypeError, 'Promise resolver undefined is not a function');
            // @ts-ignore: TS2345: Argument of type 'never[]' is not assignable to parameter of type
            //             '(resolve: Resolve<unknown>, reject: Reject) => void'.
            //                  Type 'never[]' provides no match for the signature
            //                  '(resolve: Resolve<unknown>, reject: Reject): void'.
            expect(() => new P([])).toThrowError(
                TypeError, 'Promise resolver [object Array] is not a function');
        });

        it('returns a rejected promise if resolver throws an exception', async () => {
            await expectAsync(new P(() => {
                throw new Error('A.A');
            })).toBeRejectedWith(new Error('A.A'));
        });
    });

    describe('.any( [...promises] )', () => {
        it('resolves when any of the promises resolve', async () => {
            const all = P.any([
                new P<'0'>(resolve => resolve('0')),
                P.reject(1),
            ]);

            await expectAsync(all).toBeResolvedTo('0');
        });

        it('reject when all of the promises reject with aggregate reason', async () => {
            const all = P.any([
                new P<never>((_resolve, reject) => reject('0')),
                P.reject(1),
            ]);

            await expectAsync(all).toBeRejectedWith(
                new AggregateError(['0', 1], 'All promises were rejected'));
        });
    });

    describe('.all( [...promises] )', () => {
        it('resolves when all promises resolve', async () => {
            const all = P.all([
                P.resolve('0' as const),
                P.resolve(1 as const),
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
            const all = P.all([
                P.resolve('0'),
                P.resolve(1 as const),
                new P((_resolve, reject) => {
                    setTimeout(() => reject('2' as const));
                }),
                P.reject('3' as const),
            ]);

            await expectAsync(all).toBeRejectedWith('3');
        });
    });

    describe('.race( [...promises] )', () => {
        it('returns a promise that settles as the first promise to settle', async () => {
            await expectAsync(P.race([
                P.resolve(1),
                P.reject(-1),
            ])).toBeResolvedTo(1);
            await expectAsync(P.race([
                P.reject(-1),
                P.resolve(1),
            ])).toBeRejectedWith(-1);
        });
    });

    describe('.reject( reason )', () => {
        it('returns a rejected promise with the given reason', async () => {
            await expectAsync(P.reject()).toBeRejectedWith(undefined);
            await expectAsync(P.reject(-1)).toBeRejectedWith(-1);
        });
    });

    describe('.resolve( value )', () => {
        it('returns a resolved promise with the given value', async () => {
            const resolvedVoid = P.resolve();
            await expectAsync(resolvedVoid).toBeResolvedTo(undefined);
            const resolvedOne = P.resolve(1);
            await expectAsync(resolvedOne).toBeResolvedTo(1);
        });
    });

    describe('.allSettled( [...promises] )', () => {
        it('resolves when all promises settle', async () => {
            const allSettled = P.allSettled([
                -1,
                P.resolve('0' as const),
                P.resolve(1 as const),
                P.reject('2' as const),
            ] as const);

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
            const next = P.resolve(1).then(resolveSpy);
            expect(resolveSpy).not.toHaveBeenCalled();
            await next;
            expect(resolveSpy).toHaveBeenCalledOnceWith(1);
        });

        it('should return a resolved promise with returned value from the transform', async () => {
            await expectAsync(P.resolve(1).then(() => 2)).toBeResolvedTo(2);
        });

        it('should return a promise that settles as the one returned by the transform', async () => {
            await expectAsync(P.resolve(1)
                .then(() => P.resolve(2))).toBeResolvedTo(2);
            await expectAsync(P.resolve(1)
                .then(() => P.reject(-2))).toBeRejectedWith(-2);
        });
    });

    describe('promise.catch( transform )', () => {
        it('should call given transform in the next tick of the event loop', async () => {
            const rejectSpy = createSpy('rejectSpy');
            const next = P.reject(-1).catch(rejectSpy);
            expect(rejectSpy).not.toHaveBeenCalled();
            await next;
            expect(rejectSpy).toHaveBeenCalledOnceWith(-1);
        });

        it('should return a resolved promise with returned value from the transform', async () => {
            await expectAsync(P.reject(-1).catch(() => 2)).toBeResolvedTo(2);
        });

        it('should return a promise that settles as the one returned by the transform', async () => {
            await expectAsync(P.reject(-1)
                .catch(() => P.resolve(2))).toBeResolvedTo(2);
            await expectAsync(P.reject(-1)
                .catch(() => P.reject(-2))).toBeRejectedWith(-2);
        });
    });

    describe('promise.finally(...)', () => {
        const getFinallySpy = () => finallySpy = createSpy('finallySpy');
        let finallySpy: jasmine.Spy<jasmine.Func>;
        beforeEach(() => getFinallySpy());

        it('gets called without parameters, when the promise resolves', async () => {
            P.resolve(1).finally(finallySpy);
            expect(finallySpy).not.toHaveBeenCalled();
            await P.resolve(1).finally(getFinallySpy());
            expect(finallySpy).toHaveBeenCalledOnceWith();
        });

        it('gets called without parameters, when the promise rejects', async () => {
            const rejected = P.reject(-1).finally(finallySpy);
            expect(finallySpy).not.toHaveBeenCalled();
            await expectAsync(rejected).toBeRejectedWith(-1);
            expect(finallySpy).toHaveBeenCalledOnceWith();
        });
    });

    describe('get [Symbol.toStringTag]', () => {
        it('returns the Promise constructor name (its classname)', () => {
            expect(new Promise(() => 0)[Symbol.toStringTag]).toBe(P.name);
            expect(Promise.resolve('1')[Symbol.toStringTag]).toBe(P.name);
            expect(Promise.reject(-1)[Symbol.toStringTag]).toBe(P.name);
        });
    });
});

declare function setTimeout(code: (...args: any[]) => void, delayMilliseconds?: number, ...parameters: any[]): number;
