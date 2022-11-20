import {Context} from '@squall.io/context';
import createSpy = jasmine.createSpy;

describe('Context', () => {
    describe('orphan', () => {
        it('inject string token', () => {
            const context = new Context();
            const expected = Math.random().toString(36);
            const factorySpy = createSpy('factorySpy', _ => expected).and.callThrough();

            expect(context.provide('primary', 'a', factorySpy)).toBe(context);
            expect(factorySpy).withContext('Factory evaluated eagerly.').toHaveBeenCalledOnceWith(context);
            expect(context.inject('primary', 'a')).toBe(expected);
            expect(factorySpy).withContext('Factory never evaluated.').toHaveBeenCalledOnceWith(context);
            expect(context.inject('primary', 'a')).toBe(expected);
            expect(factorySpy).withContext('Factory never eagerly.').toHaveBeenCalledOnceWith(context);
            expect(() => context.inject('a')).toThrowMatching(thrown =>
                // FIXME: Should be missing token
                thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
            expect(factorySpy).withContext('Factory never eagerly.').toHaveBeenCalledOnceWith(context);
        });
    });
})
