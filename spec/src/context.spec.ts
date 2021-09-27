import { Context } from "../../src/context";

describe('Context', () => {
    beforeEach(() => context = new Context());

    let context: Context;

    describe('#inject()', () => {
        it(`throw UNKNOWN_KEYS when some keys aren't mapped to any factories`, async () => {
            let error: any;
            await context.inject(Symbol()).then(null, reason => error = reason);

            expect(error).toBeInstanceOf(Error);
            expect(error.name).toBe(Context.UNKNOWN_KEYS as any);
        });

        it('to call factory once with context', async () => {
            const factorySpy = jasmine.createSpy('factorySpy');
            const timelapse: Context.Token<number> = Symbol();

            await context.provide([timelapse], factorySpy).inject(timelapse);

            expect(factorySpy).toHaveBeenCalledOnceWith(context);
        });

        it('to call factory once even if called multiple times', async () => {
            const factorySpy = jasmine.createSpy('factorySpy');
            const timelapse: Context.Token<number> = Symbol();

            context.provide([timelapse], factorySpy);
            await Promise.all([context.inject(timelapse), context.inject(timelapse)]);

            expect(factorySpy).toHaveBeenCalledOnceWith(context);
        });

        it('to call factory once, throttling async calls for each async token', async () => {
            // @ts-expect-error: Cannot find name 'setTimeout'.ts(2304)
            const value = new Promise(resolve => setTimeout(resolve, 100)).then(() => 44);
            const factorySpy = jasmine.createSpy('factorySpy').and.returnValue(value);
            const timelapse: Context.Token<number> = Symbol();

            context.provide([timelapse], factorySpy);
            await Promise.all([context.inject(timelapse), context.inject(timelapse)]);

            expect(factorySpy).toHaveBeenCalledOnceWith(context);
        });

        it('to return an array', async () => {
            const factorySpy = jasmine.createSpy('factorySpy');
            const timelapse: Context.Token<number> = Symbol();

            context.provide([timelapse], factorySpy);
            const dependencies = await context.inject(timelapse);

            expect(Array.isArray(dependencies)).toBeTrue();
        });

        it(`to return an array with token's factory returned value`, async () => {
            const value = Math.random();
            const timelapse: Context.Token<number> = Symbol();
            const factorySpy = jasmine.createSpy('factorySpy').and.returnValue(value);

            context.provide([timelapse], factorySpy);
            const dependencies = await context.inject(timelapse);

            expect(dependencies[0]).toBe(value);
        });

        it(`to return the same value for a given token, always`, async () => {
            const value = Math.random();
            const timelapse: Context.Token<number> = Symbol();
            const factorySpy = jasmine.createSpy('factorySpy').and.returnValue(value);

            context.provide([timelapse], factorySpy);
            const dependencies = await context.inject(timelapse, timelapse, timelapse);

            expect(dependencies).toEqual([value, value, value]);
        });

        it(`to return an array with tokens' factory returned values, in call site order`, async () => {
            const number = Math.random();
            const string = Math.random().toString(36);
            const timelapse: Context.Token<number> = Symbol();
            const babelname: Context.Token<number> = Symbol();
            const timelapseSpy = jasmine.createSpy('factorySpy').and.returnValue(number);
            const babelnameSpy = jasmine.createSpy('factorySpy').and.returnValue(string);

            context.provide([timelapse, babelname] as const, timelapseSpy, babelnameSpy);
            const dependencies = await context.inject(timelapse, babelname);

            expect(dependencies).toEqual([number, string] as any);
        });
    });

    describe('#provide', () => {
        it('create a factory for classes that accept context as their only contructor argument, if null-factory if provided', async () => {
            const constructorSpy = jasmine.createSpy();
            class Criterion { constructor(context: Context) { constructorSpy(context) } }

            context.provide([Criterion], null);
            const dependencies = await context.inject(Criterion, Criterion);

            expect(dependencies[0]).toBe(dependencies[1]);
            expect(dependencies[0]).toBeInstanceOf(Criterion);
            expect(constructorSpy).toHaveBeenCalledOnceWith(context);
        });

        it('create a factory for classes that accept context as their only contructor argument, if null-factory if provided', async () => {
            // @ts-expect-error: A spread argument must either have a tuple type or be passed to a rest parameter.ts(2556)
            const constructorSpy = jasmine.createSpy().and.callFake((...args) => new Criterion(...args));
            class Criterion { }

            context.provide([Criterion], constructorSpy);
            const dependencies = await context.inject(Criterion, Criterion);

            expect(dependencies[0]).toBe(dependencies[1]);
            expect(dependencies[0]).toBeInstanceOf(Criterion);
            expect(constructorSpy).toHaveBeenCalledOnceWith(context);
        });
    })
});
