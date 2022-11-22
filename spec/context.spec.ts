import {Context} from '@squall.io/context';
import createSpy = jasmine.createSpy;

describe('Context', () => {
    describe('.hasOwn', () => {
        it('(token)', function () {
            expect(new Context()
                .hasOwn('address')).toBeFalse();
            expect(new Context()
                .provide('address', 'here', 'around', () => 'Earth')
                .hasOwn('address')).toBeFalse();
            expect(new Context(
                new Context()
                    .provide('address', () => 'Earth'))
                .hasOwn('address')).toBeFalse();
            expect(new Context(
                new Context()
                    .provide('address', 'here', () => 'Earth'))
                .hasOwn('address')).toBeFalse();
            expect(new Context(
                new Context()
                    .provide('address', 'here', 'around', () => 'Earth'))
                .hasOwn('address')).toBeFalse();

            expect(new Context()
                .provide('address', () => 'Earth')
                .hasOwn('address')).toBeTrue();
            expect(new Context()
                .provide('address', 'here', () => 'Earth')
                .hasOwn('address')).toBeTrue();
        });

        it('(token, qualifier)', function () {
            expect(new Context()
                .hasOwn('address', 'here')).toBeFalse();
            expect(new Context()
                .provide('address', () => 'Earth')
                .hasOwn('address', 'here')).toBeFalse();
            expect(new Context(
                new Context())
                .hasOwn('address', 'here')).toBeFalse();
            expect(new Context(
                new Context()
                    .provide('address', () => 'Earth'))
                .hasOwn('address', 'here')).toBeFalse();
            expect(new Context(
                new Context()
                    .provide('address', 'here', () => 'Earth'))
                .hasOwn('address', 'here')).toBeFalse();

            expect(new Context()
                .provide('address', 'here', () => 'Earth')
                .hasOwn('address', 'here')).toBeTrue();
            expect(new Context()
                .provide('address', 'here', 'around', () => 'Earth')
                .hasOwn('address', 'here')).toBeTrue();
        });
    });

    describe('.has', () => {
        it('(token)', function () {
            expect(new Context()
                .has('HOST')).toBeFalse();
            expect(new Context()
                .provide('HEIST', () => 'La Casa de Papel')
                .has('HOST')).toBeFalse();
            expect(new Context(
                new Context()
                    .provide('HEIST', () => 'La Casa de Papel'))
                .has('HOST')).toBeFalse();
            expect(new Context(
                new Context()
                    .provide('HEIST', () => 'La Casa de Papel'))
                .provide('HOST', 'okay', 'why-not', () => 'La Casa de Papel')
                .has('HOST')).toBeFalse();

            expect(new Context()
                .provide('HOST', () => 'localhost')
                .has('HOST')).toBeTrue();
            expect(new Context()
                .provide('HOST', () => 'localhost')
                .provide('HEIST', () => 'La Casa de Papel')
                .has('HOST')).toBeTrue();
            expect(new Context(
                new Context()
                    .provide('HOST', () => 'localhost'))
                .provide('HEIST', () => 'La Casa de Papel')
                .has('HOST')).toBeTrue();
            expect(new Context()
                .provide('HOST', 'okay', () => 'La Casa de Papel')
                .has('HOST')).toBeTrue();
            expect(new Context(
                new Context()
                    .provide('HOST', 'okay', () => 'localhost'))
                .provide('HEIST', () => 'La Casa de Papel')
                .has('HOST')).toBeTrue();
        });

        it('(token, qualifier)', function () {
            expect(new Context()
                .has('HOST', 'okay')).toBeFalse();
            expect(new Context()
                .provide('HOST', () => 'localhost')
                .has('HOST', 'okay')).toBeFalse();
            expect(new Context()
                .provide('HEIST', () => 'La Casa de Papel')
                .has('HOST', 'okay')).toBeFalse();
            expect(new Context(
                new Context()
                    .provide('HEIST', () => 'La Casa de Papel'))
                .has('HOST', 'okay')).toBeFalse();
            expect(new Context(
                new Context()
                    .provide('HEIST', () => 'La Casa de Papel')
                    .provide('HOST', () => 'localhost'))
                .has('HOST', 'okay')).toBeFalse();
            expect(new Context(
                new Context()
                    .provide('HEIST', () => 'La Casa de Papel'))
                .provide('HOST', 'good-enough', 'why-not', () => 'La Casa de Papel')
                .has('HOST', 'okay')).toBeFalse();

            expect(new Context()
                .provide('HOST', 'okay', () => 'localhost')
                .has('HOST', 'okay')).toBeTrue();
            expect(new Context()
                .provide('HOST', 'okay', () => 'localhost')
                .provide('HEIST', () => 'La Casa de Papel')
                .has('HOST', 'okay')).toBeTrue();
            expect(new Context(
                new Context()
                    .provide('HOST', 'okay', () => 'localhost'))
                .provide('HEIST', () => 'La Casa de Papel')
                .has('HOST')).toBeTrue();
            expect(new Context(
                new Context()
                    .provide('HOST', 'okay', () => 'localhost'))
                .provide('HOST', () => 'localhost')
                .has('HOST', 'okay')).toBeTrue();
            expect(new Context(
                new Context()
                    .provide('HOST', 'okay', () => 'localhost'),
                new Context()
                    .provide('HOST', 'why-not', () => 'localhost'))
                .provide('HEIST', () => 'La Casa de Papel')
                .has('HOST', 'okay')).toBeTrue();
        });
    });
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
            expect(() => context.inject('a')).toThrowMatching((thrown: unknown) =>
                thrown instanceof Error && thrown.message.startsWith(Context.ERR_MISSING_TOKEN));
            expect(factorySpy).withContext('Factory never eagerly.').toHaveBeenCalledOnceWith(context);
        });
    });
})
