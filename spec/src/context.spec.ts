import { Context } from './../../src/context';

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

        it(`throw FACTORY_FAILURE when there is an error while executing a sync factory`, async () => {
            let error: any;
            const token = Symbol('errorToken');
            const reason = Math.random().toString(36);

            context.provide([token], () => { throw reason; });
            await context.inject(token).then(null, reason => error = reason);

            expect(error).toBeInstanceOf(Error);
            expect(error.suppressed).toBe(reason);
            expect(error.name).toBe(Context.FACTORY_FAILURE as any);
        });

        it(`throw FACTORY_FAILURE when there is an error while executing an async factory`, async () => {
            let error: any;
            const token = Symbol('errorToken');
            const reason = Math.random().toString(36);

            context.provide([token], () => Promise.reject(reason));
            await context.inject(token).then(null, reason => error = reason);

            expect(error).toBeInstanceOf(Error);
            expect(error.suppressed).toBe(reason);
            expect(error.name).toBe(Context.FACTORY_FAILURE as any);
        });

        it('call factory once with context', async () => {
            const factorySpy = jasmine.createSpy('factorySpy');
            const timelapse: Context.Token<number> = Symbol();

            await context.provide([timelapse], factorySpy).inject(timelapse);

            expect(factorySpy).toHaveBeenCalledOnceWith(context);
        });

        it('call factory once even if called multiple times', async () => {
            const factorySpy = jasmine.createSpy('factorySpy');
            const timelapse: Context.Token<number> = Symbol();

            context.provide([timelapse], factorySpy);
            await Promise.all([context.inject(timelapse), context.inject(timelapse)]);

            expect(factorySpy).toHaveBeenCalledOnceWith(context);
        });

        it('call factory once, throttling async calls for each async token', async () => {
            // @ts-expect-error: Cannot find name 'setTimeout'.ts(2304)
            const value = new Promise(resolve => setTimeout(resolve, 100)).then(() => 44);
            const factorySpy = jasmine.createSpy('factorySpy').and.returnValue(value);
            const timelapse: Context.Token<number> = Symbol();

            context.provide([timelapse], factorySpy);
            await Promise.all([context.inject(timelapse), context.inject(timelapse)]);

            expect(factorySpy).toHaveBeenCalledOnceWith(context);
        });

        it('return an array', async () => {
            const factorySpy = jasmine.createSpy('factorySpy');
            const timelapse: Context.Token<number> = Symbol();

            context.provide([timelapse], factorySpy);
            const dependencies = await context.inject(timelapse);

            expect(Array.isArray(dependencies)).toBeTrue();
        });

        it(`return an array with token's factory returned value`, async () => {
            const value = Math.random();
            const timelapse: Context.Token<number> = Symbol();
            const factorySpy = jasmine.createSpy('factorySpy').and.returnValue(value);

            context.provide([timelapse], factorySpy);
            const dependencies = await context.inject(timelapse);

            expect(dependencies[0]).toBe(value);
        });

        it(`return the same value for a given token, always`, async () => {
            const value = Math.random();
            const timelapse: Context.Token<number> = Symbol();
            const factorySpy = jasmine.createSpy('factorySpy').and.returnValue(value);

            context.provide([timelapse], factorySpy);
            const dependencies = await context.inject(timelapse, timelapse, timelapse);

            expect(dependencies).toEqual([value, value, value]);
        });

        it(`return an array with tokens' factory returned values, in call site order`, async () => {
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

        it(`throw UNKNOWN_KEYS when some keys aren't mapped to any factories, not even in parent hierarchy`, async () => {
            let error: any;
            await Context.from(context).inject(Symbol()).then(null, reason => error = reason);

            expect(error).toBeInstanceOf(Error);
            expect(error.name).toBe(Context.UNKNOWN_KEYS as any);
        });

        it(`throw FACTORY_FAILURE when there is an error while executing a sync factory, even through parent hierarchy`, async () => {
            let error: any;
            const token = Symbol('errorToken');
            const reason = Math.random().toString(36);

            context.provide([token], () => { throw reason; });
            await Context.from(context).inject(token).then(null, reason => error = reason);

            expect(error).toBeInstanceOf(Error);
            expect(error.suppressed).toBe(reason);
            expect(error.name).toBe(Context.FACTORY_FAILURE as any);
        });

        it(`resolve value if key is defined in parent constructor`, async () => {
            const parent: Context.Token<String> = Symbol('parentToken');
            const self: Context.Token<String> = Symbol('selfToken');
            const parentValue = Math.random().toString(36);
            const selfValue = Math.random().toString(36);
            const selfContext = Context.from(context);

            context.provide([parent], () => parentValue);
            selfContext.provide([self], () => selfValue);
            const dependencies = await selfContext.inject(parent, self, self, parent);

            expect(dependencies).toEqual([parentValue, selfValue, selfValue, parentValue]);
        });

        it(`valeu from child take precedence of parent contect`, async () => {
            const parentFactorySpy = jasmine.createSpy('parentFactorySpy');
            const token: Context.Token<String> = Symbol('value');
            const value = Math.random().toString(36);
            const child = Context.from(context);

            child.provide([token], () => value);
            context.provide([token], parentFactorySpy);
            const dependencies = await child.inject(token);

            expect(dependencies).toEqual([value]);
            expect(parentFactorySpy).not.toHaveBeenCalled();
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
