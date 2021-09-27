import { Context } from "../../src/context";

describe('Context', () => {
    beforeEach(() => context = new Context());

    let context: Context;

    describe('#inject()', () => {
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
    });
});
