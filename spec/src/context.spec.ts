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
    });
});
