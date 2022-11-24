// noinspection DuplicatedCode

import {Context} from '@squall.io/context';
import createSpy = jasmine.createSpy;

describe('Context', () => {
    describe('.hasOwn', () => {
        it('(token)', function () {
            expect(new Context()
                .hasOwn('address')).toBeFalse();
            expect(new Context()
                .provide('address', ['here', 'around'], () => 'Earth')
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
                    .provide('address', ['here', 'around'], () => 'Earth'))
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
                .provide('address', ['here', 'around'], () => 'Earth')
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
                .provide('HOST', ['okay', 'why-not'], () => 'La Casa de Papel')
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
                .provide('HOST', ['good-enough', 'why-not'], () => 'La Casa de Papel')
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

    describe('.provide', () => {
        describe('(token: string, factory)', () => {
            it('return a reference to invoked context', () => {
                const contextOne = new Context();
                expect(contextOne.provide('target', () => '')).toBe(contextOne);

                const contextTwo = new Context(contextOne);
                expect(contextTwo.provide('target', () => '')).toBe(contextTwo);

                const contextThree = new Context(contextOne, contextTwo);
                expect(contextThree.provide('target', () => '')).toBe(contextThree);
            });

            it('register token', () => {
                expect(new Context()
                    .provide('target', () => '')
                    .hasOwn('target')).toBeTrue();
            });

            it('register token at invoked context', () => {
                const parents = [new Context(), new Context()];
                const context = new Context(...parents);

                context.provide('target', () => '');

                expect(context.hasOwn('target')).toBeTrue();
                expect(parents.every(parent => !parent.hasOwn('target'))).toBeTrue();
            });

            it('invoke factory function', () => {
                const factory = createSpy('stringFactorySpy').and.returnValue(false);
                const context = new Context().provide('target', factory);

                expect(factory).toHaveBeenCalledOnceWith(context);
            });

            it('invoke factory function WHEN context configuration.factory.lazyFunctionEvaluation === false', () => {
                const factory = createSpy('stringFactorySpy').and.returnValue(false);
                const context = new Context({
                    factory: {
                        lazyFunctionEvaluation: false,
                    },
                }).provide('target', factory);

                expect(factory).toHaveBeenCalledOnceWith(context);
            });

            it('do not invoke factory function WHEN context configuration.factory.lazyFunctionEvaluation === true', () => {
                const factory = createSpy('stringFactorySpy');
                new Context({
                    factory: {
                        lazyFunctionEvaluation: true,
                    },
                }).provide('target', factory);

                expect(factory).not.toHaveBeenCalled();
            });

            it('validate factory-returned value', () => {
                expect(() => new Context()
                    .provide('address', () => '')).not.toThrow();
                expect(() => new Context()
                    .provide('address', () => Promise.resolve(''))).not.toThrow();
                expect(() => new Context()
                    .provide('address', () => Promise.resolve(null))).not.toThrow();
                expect(() => new Context()
                    .provide('address', () => Promise.resolve(undefined))).not.toThrow();
                expect(() => new Context()
                    .provide('address', () => null)).toThrowMatching(
                    thrown => thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
                expect(() => new Context()
                    .provide('address', () => undefined)).toThrowMatching(
                    thrown => thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
            });

            it('validate factory-returned value WHEN configuration.factory.lazyValidation === false', () => {
                expect(() => new Context({
                    factory: {
                        lazyValidation: false,
                    },
                }).provide('address', () => '')).not.toThrow();
                expect(() => new Context({
                    factory: {
                        lazyValidation: false,
                    },
                }).provide('address', () => Promise.resolve(''))).not.toThrow();
                expect(() => new Context({
                    factory: {
                        lazyValidation: false,
                    },
                }).provide('address', () => Promise.resolve(null))).not.toThrow();
                expect(() => new Context({
                    factory: {
                        lazyValidation: false,
                    },
                }).provide('address', () => Promise.resolve(undefined))).not.toThrow();
                expect(() => new Context({
                    factory: {
                        lazyValidation: false,
                    },
                }).provide('address', () => null)).toThrowMatching(
                    thrown => thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
            });

            it('do not validate factory-returned value WHEN configuration.factory.lazyValidation === true', () => {
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                }).provide('address', () => null)).not.toThrow();
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                }).provide('address', () => undefined)).not.toThrow();
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                }).provide('address', () => Promise.resolve(null))).not.toThrow();
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                }).provide('address', () => Promise.resolve(undefined))).not.toThrow();
            });

            it('prevent overriding token at the same context level', () => {
                expect(() => new Context()
                    .provide('address', () => 'Earth')
                    .provide('address', () => 'Earth')).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_DUPLICATE_FACTORY));
            });
        });

        describe('(token: string, qualifiers, factory)', () => {
            it('return a reference to invoked context', () => {
                const contextOne = new Context();
                expect(contextOne
                    .provide('target', 'primary', () => '')
                ).toBe(contextOne);

                const contextTwo = new Context(contextOne);
                expect(contextTwo
                    .provide('target', ['primary', 'secondary'], () => '')
                ).toBe(contextTwo);

                const contextThree = new Context(contextOne, contextTwo);
                expect(contextThree
                    .provide('target', ['primary', 'write-replica'], () => '')
                ).toBe(contextThree);
            });

            it('register token with qualifiers', () => {
                const context = new Context()
                    .provide('target', ['primary', 'write-candidate'], () => '');
                expect(context.hasOwn('target', 'primary')).toBeTrue();
                expect(context.hasOwn('target', 'write-candidate')).toBeTrue();
            });

            it('register token at invoked context', () => {
                const parents = [new Context(), new Context()];
                const context = new Context(...parents);

                context.provide('target', 'primary', () => '');

                expect(context.hasOwn('target', 'primary')).toBeTrue();
                expect(parents.every(parent => !parent.hasOwn('target', 'primary'))).toBeTrue();
            });

            it('invoke factory function', () => {
                const factory = createSpy('stringFactorySpy').and.returnValue(false);
                const context = new Context().provide('target', 'primary', factory);

                expect(factory).toHaveBeenCalledOnceWith(context);
            });

            it('invoke factory function WHEN context configuration.factory.lazyFunctionEvaluation === false', () => {
                const factory = createSpy('stringFactorySpy').and.returnValue(false);
                const context = new Context({
                    factory: {
                        lazyFunctionEvaluation: false,
                    },
                }).provide('target', ['primary', 'write-candidate'], factory);

                expect(factory).toHaveBeenCalledOnceWith(context);
            });

            it('validate factory-returned value', () => {
                expect(() => new Context()
                    .provide('address', 'primary', () => '')).not.toThrow();
                expect(() => new Context()
                    .provide('address', 'primary', () => Promise.resolve(''))).not.toThrow();
                expect(() => new Context()
                    .provide('address', 'primary', () => Promise.resolve(null))).not.toThrow();
                expect(() => new Context()
                    .provide('address', 'primary', () => Promise.resolve(undefined))).not.toThrow();
                expect(() => new Context()
                    .provide('address', 'primary', () => null)).toThrowMatching(
                    thrown => thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
                expect(() => new Context()
                    .provide('address', 'primary', () => undefined)).toThrowMatching(
                    thrown => thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
            });

            it('validate factory-returned value WHEN configuration.factory.lazyValidation === false', () => {
                expect(() => new Context({
                    factory: {
                        lazyValidation: false,
                    },
                }).provide('address', 'primary', () => '')).not.toThrow();
                expect(() => new Context({
                    factory: {
                        lazyValidation: false,
                    },
                }).provide('address', 'primary', () => Promise.resolve(''))).not.toThrow();
                expect(() => new Context({
                    factory: {
                        lazyValidation: false,
                    },
                }).provide('address', 'primary', () => Promise.resolve(null))).not.toThrow();
                expect(() => new Context({
                    factory: {
                        lazyValidation: false,
                    },
                }).provide('address', 'primary', () => Promise.resolve(undefined))).not.toThrow();
                expect(() => new Context({
                    factory: {
                        lazyValidation: false,
                    },
                }).provide('address', 'primary', () => null)).toThrowMatching(
                    thrown => thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
            });

            it('do not validate factory-returned value WHEN configuration.factory.lazyValidation === true', () => {
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                }).provide('address', 'primary', () => null)).not.toThrow();
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                }).provide('address', 'primary', () => undefined)).not.toThrow();
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                }).provide('address', 'primary', () => Promise.resolve(null))).not.toThrow();
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                }).provide('address', 'primary', () => Promise.resolve(undefined))).not.toThrow();
            });

            it('prevent overriding token at the same context level', () => {
                expect(() => new Context()
                    .provide('address', 'primary', () => 'Earth')
                    .provide('address', 'primary', () => 'Earth')).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_DUPLICATE_FACTORY));
                expect(() => new Context()
                    .provide('address', ['primary', 'write-candidate'], () => 'Earth')
                    .provide('address', 'primary', () => 'Earth')).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_DUPLICATE_FACTORY));
            });
        });

        describe('(token: Class, factory)', () => {
            class Nothing {
                brand?: string;
            }

            it('return a reference to invoked context', () => {
                const contextOne = new Context();
                expect(contextOne.provide(Nothing, () => new Nothing())).toBe(contextOne);

                const contextTwo = new Context(contextOne);
                expect(contextTwo.provide(Nothing, () => new Nothing())).toBe(contextTwo);

                const contextThree = new Context(contextOne, contextTwo);
                expect(contextThree.provide(Nothing, () => new Nothing())).toBe(contextThree);
            });

            it('register token', () => {
                expect(new Context()
                    .provide(Nothing, () => new Nothing())
                    .hasOwn(Nothing)).toBeTrue();
            });

            it('register token at invoked context', () => {
                const parents = [new Context(), new Context()];
                const context = new Context(...parents);

                context.provide(Nothing, () => new Nothing());

                expect(context.hasOwn(Nothing)).toBeTrue();
                expect(parents.every(parent => !parent.hasOwn(Nothing))).toBeTrue();
            });

            it('invoke factory function', () => {
                const factory = createSpy('stringFactorySpy').and.returnValue(false);
                const context = new Context().provide(Nothing, factory);

                expect(factory).toHaveBeenCalledOnceWith(context);
            });

            it('invoke factory function WHEN context configuration.factory.lazyFunctionEvaluation === false', () => {
                const factory = createSpy('stringFactorySpy').and.returnValue(false);

                const context = new Context({
                    factory: {
                        lazyFunctionEvaluation: false,
                    },
                }).provide(Nothing, factory);

                expect(factory).toHaveBeenCalledOnceWith(context);
            });

            it('do not invoke factory function WHEN context configuration.factory.lazyFunctionEvaluation === true', () => {
                const factory = createSpy('stringFactorySpy');

                new Context({
                    factory: {
                        lazyFunctionEvaluation: true,
                    },
                }).provide(Nothing, factory);

                expect(factory).not.toHaveBeenCalled();
            });

            it('validate factory-returned value', () => {
                expect(() => new Context()
                    .provide(Nothing, () => new Nothing())).not.toThrow();
                expect(() => new Context()
                    .provide(Nothing, () => new Nothing())).not.toThrow();
                expect(() => new Context()
                    .provide(Nothing, () => new Nothing())).not.toThrow();
                expect(() => new Context()
                    .provide(Nothing, () => new Nothing())).not.toThrow();
                expect(() => new Context()
                    .provide(Nothing, () => null as any as Nothing)).toThrowMatching(
                    thrown => thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
                expect(() => new Context()
                    .provide(Nothing, () => undefined as any as Nothing)).toThrowMatching(
                    thrown => thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
            });

            it('validate factory-returned value WHEN configuration.factory.lazyValidation === false', () => {
                expect(() => new Context({
                    factory: {
                        lazyValidation: false,
                    },
                }).provide(Nothing, () => new Nothing())).not.toThrow();
                expect(() => new Context({
                    factory: {
                        lazyValidation: false,
                    },
                }).provide(Nothing, () => new Nothing())).not.toThrow();
                expect(() => new Context({
                    factory: {
                        lazyValidation: false,
                    },
                }).provide(Nothing, () => new Nothing())).not.toThrow();
                expect(() => new Context({
                    factory: {
                        lazyValidation: false,
                    },
                }).provide(Nothing, () => new Nothing())).not.toThrow();
                expect(() => new Context({
                    factory: {
                        lazyValidation: false,
                    },
                }).provide(Nothing, () => null as any as Nothing)).toThrowMatching(
                    thrown => thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
            });

            it('do not validate factory-returned value WHEN configuration.factory.lazyValidation === true', () => {
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                }).provide(Nothing, () => null as any as Nothing)).not.toThrow();
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                }).provide(Nothing, () => undefined as any as Nothing)).not.toThrow();
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                }).provide(Nothing, () => new Nothing())).not.toThrow();
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                }).provide(Nothing, () => new Nothing())).not.toThrow();
            });

            it('prevent overriding token at the same context level', () => {
                expect(() => new Context()
                    .provide(Nothing, () => new Nothing())
                    .provide(Nothing, () => new Nothing())).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_DUPLICATE_FACTORY));
            });
        });

        describe('(token: Class, value)', () => {
            class Nothing {
                brand?: string;
            }

            it('return a reference to invoked context', () => {
                const contextOne = new Context();
                expect(contextOne.provide(Nothing, new Nothing())).toBe(contextOne);

                const contextTwo = new Context(contextOne);
                expect(contextTwo.provide(Nothing, new Nothing())).toBe(contextTwo);

                const contextThree = new Context(contextOne, contextTwo);
                expect(contextThree.provide(Nothing, new Nothing())).toBe(contextThree);
            });

            it('register token', () => {
                expect(new Context()
                    .provide(Nothing, new Nothing())
                    .hasOwn(Nothing)).toBeTrue();
            });

            it('register token at invoked context', () => {
                const parents = [new Context(), new Context()];
                const context = new Context(...parents);

                context.provide(Nothing, new Nothing());

                expect(context.hasOwn(Nothing)).toBeTrue();
                expect(parents.every(parent => !parent.hasOwn(Nothing))).toBeTrue();
            });

            it('invoke factory function WHEN context configuration.factory.lazyFunctionEvaluation === false', () => {
                const factory = createSpy('stringFactorySpy').and.returnValue(false);

                const context = new Context({
                    factory: {
                        lazyFunctionEvaluation: false,
                    },
                }).provide(Nothing, factory);

                expect(factory).toHaveBeenCalledOnceWith(context);
            });

            it('do not invoke factory function WHEN context configuration.factory.lazyFunctionEvaluation === true', () => {
                const factory = createSpy('stringFactorySpy');

                new Context({
                    factory: {
                        lazyFunctionEvaluation: true,
                    },
                }).provide(Nothing, factory);

                expect(factory).not.toHaveBeenCalled();
            });

            it('validate value', () => {
                expect(() => new Context()
                    .provide(Nothing, new Nothing())).not.toThrow();
                expect(() => new Context()
                    .provide(Nothing, new Nothing())).not.toThrow();
                expect(() => new Context()
                    .provide(Nothing, null as any as Nothing)).toThrowMatching(
                    thrown => thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
                expect(() => new Context()
                    .provide(Nothing, undefined as any as Nothing)).toThrowMatching(
                    thrown => thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
            });

            it('validate value WHEN configuration.factory.lazyValidation === false', () => {
                expect(() => new Context({
                    factory: {
                        lazyValidation: false,
                    },
                }).provide(Nothing, new Nothing())).not.toThrow();
                expect(() => new Context({
                    factory: {
                        lazyValidation: false,
                    },
                }).provide(Nothing, new Nothing())).not.toThrow();
                expect(() => new Context({
                    factory: {
                        lazyValidation: false,
                    },
                }).provide(Nothing, new Nothing())).not.toThrow();
                expect(() => new Context({
                    factory: {
                        lazyValidation: false,
                    },
                }).provide(Nothing, () => new Nothing())).not.toThrow();
                expect(() => new Context({
                    factory: {
                        lazyValidation: false,
                    },
                }).provide(Nothing, null as any as Nothing)).toThrowMatching(
                    thrown => thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
                expect(() => new Context({
                    factory: {
                        lazyValidation: false,
                    },
                }).provide(Nothing, undefined as any as Nothing)).toThrowMatching(
                    thrown => thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
            });

            it('do not validate value WHEN configuration.factory.lazyValidation === true', () => {
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                }).provide(Nothing, null as any as Nothing)).not.toThrow();
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                }).provide(Nothing, undefined as any as Nothing)).not.toThrow();
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                }).provide(Nothing, new Nothing())).not.toThrow();
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                }).provide(Nothing, new Nothing())).not.toThrow();
            });

            it('prevent overriding token at the same context level', () => {
                expect(() => new Context()
                    .provide(Nothing, new Nothing())
                    .provide(Nothing, new Nothing())).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_DUPLICATE_FACTORY));
            });
        });

        describe('(token: Context.Token, factory)', () => {
            class Nothing {
                brand?: string;
            }

            const NOTHING_TOKEN: Context.Token<Nothing> = Symbol('Nothing Token');

            it('return a reference to invoked context', () => {
                const contextOne = new Context();
                expect(contextOne.provide(NOTHING_TOKEN, () => new Nothing())).toBe(contextOne);

                const contextTwo = new Context(contextOne);
                expect(contextTwo.provide(NOTHING_TOKEN, () => new Nothing())).toBe(contextTwo);

                const contextThree = new Context(contextOne, contextTwo);
                expect(contextThree.provide(NOTHING_TOKEN, () => new Nothing())).toBe(contextThree);
            });

            it('register token', () => {
                expect(new Context()
                    .provide(NOTHING_TOKEN, () => new Nothing())
                    .hasOwn(NOTHING_TOKEN,)).toBeTrue();
            });

            it('register token at invoked context', () => {
                const parents = [new Context(), new Context()];
                const context = new Context(...parents);

                context.provide(NOTHING_TOKEN, () => new Nothing());

                expect(context.hasOwn(NOTHING_TOKEN,)).toBeTrue();
                expect(parents.every(parent => !parent.hasOwn(NOTHING_TOKEN,))).toBeTrue();
            });

            it('invoke factory function', () => {
                const factory = createSpy('stringFactorySpy').and.returnValue(false);
                const context = new Context().provide(NOTHING_TOKEN, factory);

                expect(factory).toHaveBeenCalledOnceWith(context);
            });

            it('invoke factory function WHEN context configuration.factory.lazyFunctionEvaluation === false', () => {
                const factory = createSpy('stringFactorySpy').and.returnValue(false);

                const context = new Context({
                    factory: {
                        lazyFunctionEvaluation: false,
                    },
                }).provide(NOTHING_TOKEN, factory);

                expect(factory).toHaveBeenCalledOnceWith(context);
            });

            it('do not invoke factory function WHEN context configuration.factory.lazyFunctionEvaluation === true', () => {
                const factory = createSpy('stringFactorySpy');

                new Context({
                    factory: {
                        lazyFunctionEvaluation: true,
                    },
                }).provide(NOTHING_TOKEN, factory);

                expect(factory).not.toHaveBeenCalled();
            });

            it('validate factory-returned value', () => {
                expect(() => new Context()
                    .provide(NOTHING_TOKEN, () => new Nothing())).not.toThrow();
                expect(() => new Context()
                    .provide(NOTHING_TOKEN, () => new Nothing())).not.toThrow();
                expect(() => new Context()
                    .provide(NOTHING_TOKEN, () => new Nothing())).not.toThrow();
                expect(() => new Context()
                    .provide(NOTHING_TOKEN, () => new Nothing())).not.toThrow();
                expect(() => new Context()
                    .provide(NOTHING_TOKEN, () => null as any as Nothing)).toThrowMatching(
                    thrown => thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
                expect(() => new Context()
                    .provide(NOTHING_TOKEN, () => undefined as any as Nothing)).toThrowMatching(
                    thrown => thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
            });

            it('validate factory-returned value WHEN configuration.factory.lazyValidation === false', () => {
                expect(() => new Context({
                    factory: {
                        lazyValidation: false,
                    },
                }).provide(NOTHING_TOKEN, () => new Nothing())).not.toThrow();
                expect(() => new Context({
                    factory: {
                        lazyValidation: false,
                    },
                }).provide(NOTHING_TOKEN, () => new Nothing())).not.toThrow();
                expect(() => new Context({
                    factory: {
                        lazyValidation: false,
                    },
                }).provide(NOTHING_TOKEN, () => new Nothing())).not.toThrow();
                expect(() => new Context({
                    factory: {
                        lazyValidation: false,
                    },
                }).provide(NOTHING_TOKEN, () => new Nothing())).not.toThrow();
                expect(() => new Context({
                    factory: {
                        lazyValidation: false,
                    },
                }).provide(NOTHING_TOKEN, () => null as any as Nothing)).toThrowMatching(
                    thrown => thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
            });

            it('do not validate factory-returned value WHEN configuration.factory.lazyValidation === true', () => {
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                }).provide(NOTHING_TOKEN, () => null as any as Nothing)).not.toThrow();
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                }).provide(NOTHING_TOKEN, () => undefined as any as Nothing)).not.toThrow();
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                }).provide(NOTHING_TOKEN, () => new Nothing())).not.toThrow();
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                }).provide(NOTHING_TOKEN, () => new Nothing())).not.toThrow();
            });

            it('prevent overriding token at the same context level', () => {
                expect(() => new Context()
                    .provide(NOTHING_TOKEN, () => new Nothing())
                    .provide(NOTHING_TOKEN, () => new Nothing())).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_DUPLICATE_FACTORY));
            });
        });

        describe('(token: Context.Token, value)', () => {
            class Nothing {
                brand?: string;
            }

            const NOTHING_TOKEN: Context.Token<Nothing> = Symbol('Nothing Token');

            it('return a reference to invoked context', () => {
                const contextOne = new Context();
                expect(contextOne.provide(NOTHING_TOKEN, new Nothing())).toBe(contextOne);

                const contextTwo = new Context(contextOne);
                expect(contextTwo.provide(NOTHING_TOKEN, new Nothing())).toBe(contextTwo);

                const contextThree = new Context(contextOne, contextTwo);
                expect(contextThree.provide(NOTHING_TOKEN, new Nothing())).toBe(contextThree);
            });

            it('register token', () => {
                expect(new Context()
                    .provide(NOTHING_TOKEN, new Nothing())
                    .hasOwn(NOTHING_TOKEN,)).toBeTrue();
            });

            it('register token at invoked context', () => {
                const parents = [new Context(), new Context()];
                const context = new Context(...parents);

                context.provide(NOTHING_TOKEN, new Nothing());

                expect(context.hasOwn(NOTHING_TOKEN,)).toBeTrue();
                expect(parents.every(parent => !parent.hasOwn(NOTHING_TOKEN,))).toBeTrue();
            });

            it('invoke factory function WHEN context configuration.factory.lazyFunctionEvaluation === false', () => {
                const factory = createSpy('stringFactorySpy').and.returnValue(false);

                const context = new Context({
                    factory: {
                        lazyFunctionEvaluation: false,
                    },
                }).provide(NOTHING_TOKEN, factory);

                expect(factory).toHaveBeenCalledOnceWith(context);
            });

            it('do not invoke factory function WHEN context configuration.factory.lazyFunctionEvaluation === true', () => {
                const factory = createSpy('stringFactorySpy');

                new Context({
                    factory: {
                        lazyFunctionEvaluation: true,
                    },
                }).provide(NOTHING_TOKEN, factory);

                expect(factory).not.toHaveBeenCalled();
            });

            it('validate value', () => {
                expect(() => new Context()
                    .provide(NOTHING_TOKEN, new Nothing())).not.toThrow();
                expect(() => new Context()
                    .provide(NOTHING_TOKEN, new Nothing())).not.toThrow();
                expect(() => new Context()
                    .provide(NOTHING_TOKEN, null as any as Nothing)).toThrowMatching(
                    thrown => thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
                expect(() => new Context()
                    .provide(NOTHING_TOKEN, undefined as any as Nothing)).toThrowMatching(
                    thrown => thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
            });

            it('validate value WHEN configuration.factory.lazyValidation === false', () => {
                expect(() => new Context({
                    factory: {
                        lazyValidation: false,
                    },
                }).provide(NOTHING_TOKEN, new Nothing())).not.toThrow();
                expect(() => new Context({
                    factory: {
                        lazyValidation: false,
                    },
                }).provide(NOTHING_TOKEN, new Nothing())).not.toThrow();
                expect(() => new Context({
                    factory: {
                        lazyValidation: false,
                    },
                }).provide(NOTHING_TOKEN, new Nothing())).not.toThrow();
                expect(() => new Context({
                    factory: {
                        lazyValidation: false,
                    },
                }).provide(NOTHING_TOKEN, () => new Nothing())).not.toThrow();
                expect(() => new Context({
                    factory: {
                        lazyValidation: false,
                    },
                }).provide(NOTHING_TOKEN, null as any as Nothing)).toThrowMatching(
                    thrown => thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
                expect(() => new Context({
                    factory: {
                        lazyValidation: false,
                    },
                }).provide(NOTHING_TOKEN, undefined as any as Nothing)).toThrowMatching(
                    thrown => thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
            });

            it('do not validate value WHEN configuration.factory.lazyValidation === true', () => {
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                }).provide(NOTHING_TOKEN, null as any as Nothing)).not.toThrow();
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                }).provide(NOTHING_TOKEN, undefined as any as Nothing)).not.toThrow();
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                }).provide(NOTHING_TOKEN, new Nothing())).not.toThrow();
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                }).provide(NOTHING_TOKEN, new Nothing())).not.toThrow();
            });

            it('prevent overriding token at the same context level', () => {
                expect(() => new Context()
                    .provide(NOTHING_TOKEN, new Nothing())
                    .provide(NOTHING_TOKEN, new Nothing())).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_DUPLICATE_FACTORY));
            });
        });
    });

    describe('inject', () => {
        describe('(token: string)', () => {
            it('return provided value', () => {
                const expected = Math.random().toString(36);
                expect(new Context()
                    .provide('address', () => expected)
                    .inject('address')
                ).toBe(expected);
            });

            it('return default qualified value', () => {
                const expected = Math.random().toString(36);
                expect(new Context()
                    .provide('address', () => expected)
                    .provide('address', 'home', () => Math.random().toString(36))
                    .inject('address')
                ).toBe(expected);
                expect(new Context()
                    .provide('address', 'home', () => expected)
                    .inject('address')
                ).toBe(expected);
            });

            it('return default qualified value from ancestor WHEN not possible at descendant level', () => {
                const expected = Math.random().toString(36);
                expect(new Context(
                    new Context()
                        .provide('address', () => expected))
                    .inject('address')
                ).toBe(expected);
            });

            it('return cached factory-evaluated value', () => {
                const expected = Math.random().toString(36);
                const factory = createSpy('stringFactorySpy')
                    .and.returnValues(expected, Math.random().toString(36));
                const context = new Context().provide('address', factory);

                expect(factory).toHaveBeenCalledOnceWith(context);
                expect(context.inject('address')).toBe(expected);
                expect(factory).toHaveBeenCalledOnceWith(context);
                expect(context.inject('address')).toBe(expected);
                expect(factory).toHaveBeenCalledOnceWith(context);

                const otherExpected = Math.random().toString(36);
                const otherFactory = createSpy('stringFactorySpy')
                    .and.returnValues(otherExpected, Math.random().toString(36));
                const otherContext = new Context().provide('address', otherFactory);

                expect(otherFactory).toHaveBeenCalledOnceWith(otherContext);
                expect(otherContext.inject('address')).toBe(otherExpected);
                expect(otherFactory).toHaveBeenCalledOnceWith(otherContext);
                expect(otherContext.inject('address')).toBe(otherExpected);
                expect(otherFactory).toHaveBeenCalledOnceWith(otherContext);

                const anotherExpected = Math.random().toString(36);
                const anotherFactory = createSpy('stringFactorySpy')
                    .and.returnValues(anotherExpected, Math.random().toString(36));
                const anotherContext = new Context({
                    factory: {
                        lazyFunctionEvaluation: true,
                    }
                }).provide('address', anotherFactory);

                expect(anotherFactory).not.toHaveBeenCalled();
                expect(anotherContext
                    .inject('address')).toBe(anotherExpected);
                expect(anotherFactory).toHaveBeenCalledOnceWith(anotherContext);
                expect(anotherContext.inject('address')).toBe(anotherExpected);
                expect(anotherFactory).toHaveBeenCalledOnceWith(anotherContext);
            });

            it('evaluate factory with invocation context', () => {
                const expected = Math.random().toString(36);
                const factory = createSpy('stringFactorySpy').and.returnValues(expected);
                const context = new Context(new Context()
                    .provide('address', factory));

                context.inject('address');
                expect(factory).toHaveBeenCalledOnceWith(context);
            });

            it('caches factory-evaluated value at bean definition context', () => {
                const expected = Math.random().toString(36);
                const factory = createSpy('stringFactorySpy').and.returnValues(expected);
                const parent = new Context().provide('address', factory);
                const context = new Context(parent);

                expect(context.inject('address')).toBe(expected);
                expect(factory).toHaveBeenCalledOnceWith(context);
                expect(parent.inject('address')).toBe(expected);
                expect(factory).toHaveBeenCalledOnceWith(context);
            });

            it('fail WHEN factory-evaluated value is empty', () => {
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                })
                    .provide('address', () => null)
                    .inject('address')).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
                expect(() => new Context({
                    factory: {
                        lazyFunctionEvaluation: true,
                    }
                })
                    .provide('address', () => null)
                    .inject('address')).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                })
                    .provide('address', () => undefined)
                    .inject('address')).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
                expect(() => new Context({
                    factory: {
                        lazyFunctionEvaluation: true,
                    }
                })
                    .provide('address', () => undefined)
                    .inject('address')).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
            });

            it('fail WHEN factory-evaluated promise value is empty', async () => {
                await expectAsync(new Context()
                    .provide('address', () => Promise.resolve(null))
                    .inject('address')
                ).toBeRejectedWithError(new RegExp(`^${Context.ERR_EMPTY_VALUE}`));
                await expectAsync(new Context()
                    .provide('address', () => Promise.resolve(undefined))
                    .inject('address')
                ).toBeRejectedWithError(new RegExp(`^${Context.ERR_EMPTY_VALUE}`));

                const expected = Math.random().toString(36);
                await expectAsync(new Context()
                    .provide('address', () => Promise.resolve(expected))
                    .inject('address')
                ).toBeResolvedTo(expected);
            });

            it('fail WHEN there is undecidable bean at any level of contexts', () => {
                const expected = Math.random().toString(36);
                expect(() => new Context(
                    new Context()
                        .provide('address', () => expected))
                    .provide('address', 'home', () => Math.random().toString(36))
                    .provide('address', 'work', () => Math.random().toString(36))
                    .inject('address')).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_UNDECIDABLE_BEAN));
            });

            it('fail WHEN no bean definition the tree has been provided', () => {
                expect(() => new Context().inject('home')).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_MISSING_TOKEN));
            });
        });

        describe('(token: string, qualifier: string)', () => {
            it('return provided value', () => {
                const expected = Math.random().toString(36);
                expect(new Context()
                    .provide('address', () => expected)
                    .inject('address')
                ).toBe(expected);
            });

            it('return default qualified value', () => {
                const expected = Math.random().toString(36);
                expect(new Context()
                    .provide('address', () => expected)
                    .provide('address', 'home', () => Math.random().toString(36))
                    .inject('address')
                ).toBe(expected);
                expect(new Context()
                    .provide('address', 'home', () => expected)
                    .inject('address')
                ).toBe(expected);
            });

            it('return default qualified value from ancestor WHEN not possible at descendant level', () => {
                const expected = Math.random().toString(36);
                expect(new Context(
                    new Context()
                        .provide('address', 'home', () => expected))
                    .inject('address', 'home')
                ).toBe(expected);
            });

            it('return cached factory-evaluated value', () => {
                const expected = Math.random().toString(36);
                const factory = createSpy('stringFactorySpy')
                    .and.returnValues(expected, Math.random().toString(36));
                const context = new Context().provide('address', 'home', factory);

                expect(factory).toHaveBeenCalledOnceWith(context);
                expect(context.inject('address', 'home')).toBe(expected);
                expect(factory).toHaveBeenCalledOnceWith(context);
                expect(context.inject('address', 'home')).toBe(expected);
                expect(factory).toHaveBeenCalledOnceWith(context);

                const otherExpected = Math.random().toString(36);
                const otherFactory = createSpy('stringFactorySpy')
                    .and.returnValues(otherExpected, Math.random().toString(36));
                const otherContext = new Context().provide('address', 'home', otherFactory);

                expect(otherFactory).toHaveBeenCalledOnceWith(otherContext);
                expect(otherContext.inject('address', 'home')).toBe(otherExpected);
                expect(otherFactory).toHaveBeenCalledOnceWith(otherContext);
                expect(otherContext.inject('address', 'home')).toBe(otherExpected);
                expect(otherFactory).toHaveBeenCalledOnceWith(otherContext);

                const anotherExpected = Math.random().toString(36);
                const anotherFactory = createSpy('stringFactorySpy')
                    .and.returnValues(anotherExpected, Math.random().toString(36));
                const anotherContext = new Context({
                    factory: {
                        lazyFunctionEvaluation: true,
                    }
                }).provide('address', 'home', anotherFactory);

                expect(anotherFactory).not.toHaveBeenCalled();
                expect(anotherContext
                    .inject('address', 'home')).toBe(anotherExpected);
                expect(anotherFactory).toHaveBeenCalledOnceWith(anotherContext);
                expect(anotherContext.inject('address', 'home')).toBe(anotherExpected);
                expect(anotherFactory).toHaveBeenCalledOnceWith(anotherContext);
            });

            it('evaluate factory with invocation context', () => {
                const expected = Math.random().toString(36);
                const factory = createSpy('stringFactorySpy').and.returnValues(expected);
                const context = new Context(new Context()
                    .provide('address', 'home', factory));

                context.inject('address', 'home');
                expect(factory).toHaveBeenCalledOnceWith(context);
            });

            it('caches factory-evaluated value at bean definition context', () => {
                const expected = Math.random().toString(36);
                const factory = createSpy('stringFactorySpy').and.returnValues(expected);
                const parent = new Context().provide('address', 'home', factory);
                const context = new Context(parent);

                expect(context.inject('address', 'home')).toBe(expected);
                expect(factory).toHaveBeenCalledOnceWith(context);
                expect(parent.inject('address', 'home')).toBe(expected);
                expect(factory).toHaveBeenCalledOnceWith(context);
            });

            it('fail WHEN factory-evaluated value is empty', () => {
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                })
                    .provide('address', 'home', () => null)
                    .inject('address', 'home')).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
                expect(() => new Context({
                    factory: {
                        lazyFunctionEvaluation: true,
                    }
                })
                    .provide('address', 'home', () => null)
                    .inject('address', 'home')).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                })
                    .provide('address', 'home', () => undefined)
                    .inject('address', 'home')).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
                expect(() => new Context({
                    factory: {
                        lazyFunctionEvaluation: true,
                    }
                })
                    .provide('address', 'home', () => undefined)
                    .inject('address', 'home')).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
            });

            it('fail WHEN factory-evaluated promise value is empty', async () => {
                await expectAsync(new Context()
                    .provide('address', 'home', () => Promise.resolve(null))
                    .inject('address', 'home')
                ).toBeRejectedWithError(new RegExp(`^${Context.ERR_EMPTY_VALUE}`));
                await expectAsync(new Context()
                    .provide('address', 'home', () => Promise.resolve(undefined))
                    .inject('address', 'home')
                ).toBeRejectedWithError(new RegExp(`^${Context.ERR_EMPTY_VALUE}`));

                const expected = Math.random().toString(36);
                await expectAsync(new Context()
                    .provide('address', 'home', () => Promise.resolve(expected))
                    .inject('address', 'home')
                ).toBeResolvedTo(expected);
            });

            it('fail WHEN no bean definition the tree has been provided', () => {
                expect(() => new Context().inject('address', 'home')).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_MISSING_TOKEN));
            });
        });

        describe('(token: string, injectOptions)', () => {
            it('resolve bean', async () => {
                const expected = Math.random().toString(36);
                expect(new Context()
                    .provide('address', () => expected)
                    .inject('address', {})
                ).toBe(expected);
                await expectAsync(new Context()
                    .provide('address', () => Promise.resolve(expected))
                    .inject('address', {})
                ).toBeResolvedTo(expected);

                expect(new Context()
                    .provide('address', 'work', () => expected)
                    .inject('address', {qualifier: 'work'})
                ).toBe(expected);
                await expectAsync(new Context()
                    .provide('address', 'work', () => Promise.resolve(expected))
                    .inject('address', {qualifier: 'work'})
                ).toBeResolvedTo(expected);

                let context = new Context();
                let factory = createSpy('stringFactorySpy').and.returnValue(expected);
                expect(context
                    .provide('address', 'work', factory)
                    .inject('address', {qualifier: 'work', forceEvaluation: false})
                ).toBe(expected);
                expect(factory).toHaveBeenCalledOnceWith(context);
                context = new Context();
                factory = createSpy('stringFactorySpy').and.resolveTo(expected);
                await expectAsync(new Context()
                    .provide('address', 'work', factory)
                    .inject('address', {qualifier: 'work', forceEvaluation: false})
                ).toBeResolvedTo(expected);
                expect(factory).toHaveBeenCalledOnceWith(context);
            });

            it('fail WHEN value is empty', async () => {
                expect(() => new Context({factory: {lazyFunctionEvaluation: true}})
                    .provide('address', () => null)
                    .inject('address', {})).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
                expect(() => new Context({factory: {lazyFunctionEvaluation: true}})
                    .provide('address', () => undefined)
                    .inject('address', {})).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));

                expect(() => new Context({factory: {lazyFunctionEvaluation: true}})
                    .provide('address', 'home', () => null)
                    .inject('address', {qualifier: 'home'})).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
                expect(() => new Context({factory: {lazyFunctionEvaluation: true}})
                    .provide('address', 'home', () => undefined)
                    .inject('address', {qualifier: 'home'})).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));


                await expectAsync(new Context({factory: {lazyFunctionEvaluation: true}})
                    .provide('address', () => Promise.resolve(null))
                    .inject('address', {})
                ).toBeRejectedWithError(new RegExp(`^${Context.ERR_EMPTY_VALUE}`));
                await expectAsync(new Context({factory: {lazyFunctionEvaluation: true}})
                    .provide('address', () => Promise.resolve(undefined))
                    .inject('address', {})
                ).toBeRejectedWithError(new RegExp(`^${Context.ERR_EMPTY_VALUE}`));

                let context = new Context();
                let factory = createSpy('stringFactorySpy').and.resolveTo(null);
                await expectAsync(context
                    .provide('address', 'work', factory)
                    .inject('address', {qualifier: 'work', forceEvaluation: false})
                ).toBeRejectedWithError(new RegExp(`^${Context.ERR_EMPTY_VALUE}`));
                expect(factory).toHaveBeenCalledOnceWith(context);
                context = new Context();
                factory = createSpy('stringFactorySpy').and.resolveTo(undefined);
                await expectAsync(new Context()
                    .provide('address', 'work', factory)
                    .inject('address', {qualifier: 'work', forceEvaluation: false})
                ).toBeRejectedWithError(new RegExp(`^${Context.ERR_EMPTY_VALUE}`));
                expect(factory).toHaveBeenCalledOnceWith(context);
            });

            it('revaluate factory and validate value WHEN injectOptions.forceEvaluation === true, without caching the result', async () => {
                let factory = createSpy('stringFactorySpy').and.returnValues(0, 1, 2);
                let context = new Context().provide('counter', factory);
                expect(factory).toHaveBeenCalledOnceWith(context);
                expect(context.inject('counter', {
                    forceEvaluation: true,
                })).toBe(1);
                expect(factory).toHaveBeenCalledTimes(2);
                expect(context.inject('counter', {
                    forceEvaluation: true,
                })).toBe(2);
                expect(factory).toHaveBeenCalledTimes(3);
                expect(context.inject('counter', {})).toBe(0);
                expect(factory).toHaveBeenCalledTimes(3);

                factory = createSpy('stringFactorySpy').and.returnValues(0, null, undefined, 2);
                context = new Context().provide('counter', factory);
                expect(factory).toHaveBeenCalledOnceWith(context);
                expect(() => context.inject('counter', {
                    forceEvaluation: true,
                })).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
                expect(factory).toHaveBeenCalledTimes(2);
                expect(() => context.inject('counter', {
                    forceEvaluation: true,
                })).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
                expect(factory).toHaveBeenCalledTimes(3);
                expect(context.inject('counter', {
                    forceEvaluation: true,
                })).toBe(2);
                expect(factory).toHaveBeenCalledTimes(4);
                expect(context.inject('counter', {})).toBe(0);
                expect(factory).toHaveBeenCalledTimes(4);

                factory = createSpy('stringFactorySpy').and.returnValues(Promise.resolve(0),
                    Promise.resolve(1), Promise.resolve(2));
                context = new Context().provide('counter', factory);
                expect(factory).toHaveBeenCalledOnceWith(context);
                await expectAsync(context.inject('counter', {
                    forceEvaluation: true,
                })).toBeResolvedTo(1);
                expect(factory).toHaveBeenCalledTimes(2);
                await expectAsync(context.inject('counter', {
                    forceEvaluation: true,
                })).toBeResolvedTo(2);
                expect(factory).toHaveBeenCalledTimes(3);
                await expectAsync(context.inject('counter', {})).toBeResolvedTo(0);
                expect(factory).toHaveBeenCalledTimes(3);

                factory = createSpy('stringFactorySpy').and.returnValues(Promise.resolve(0),
                    Promise.resolve(null), Promise.resolve(undefined), Promise.resolve(2));
                context = new Context().provide('counter', factory);
                expect(factory).toHaveBeenCalledOnceWith(context);
                await expectAsync(context.inject('counter', {
                    forceEvaluation: true,
                })).toBeRejectedWithError(new RegExp(`^${Context.ERR_EMPTY_VALUE}`));
                expect(factory).toHaveBeenCalledTimes(2);
                await expectAsync(context.inject('counter', {
                    forceEvaluation: true,
                })).toBeRejectedWithError(new RegExp(`^${Context.ERR_EMPTY_VALUE}`));
                expect(factory).toHaveBeenCalledTimes(3);
                await expectAsync(context.inject('counter', {
                    forceEvaluation: true,
                })).toBeResolvedTo(2);
                expect(factory).toHaveBeenCalledTimes(4);
                await expectAsync(context.inject('counter', {})).toBeResolvedTo(0);
                expect(factory).toHaveBeenCalledTimes(4);


                factory = createSpy('stringFactorySpy').and.returnValues(0, 1, 2);
                context = new Context().provide('counter', '1-step', factory);
                expect(factory).toHaveBeenCalledOnceWith(context);
                expect(context.inject('counter', {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).toEqual(1);
                expect(factory).toHaveBeenCalledTimes(2);
                expect(context.inject('counter', {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).toEqual(2);
                expect(factory).toHaveBeenCalledTimes(3);
                expect(context.inject('counter', {
                    qualifier: '1-step',
                })).toEqual(0);
                expect(factory).toHaveBeenCalledTimes(3);

                factory = createSpy('stringFactorySpy').and.returnValues(0, null, undefined, 2);
                context = new Context().provide('counter', '1-step', factory);
                expect(factory).toHaveBeenCalledOnceWith(context);
                expect(() => context.inject('counter', {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
                expect(factory).toHaveBeenCalledTimes(2);
                expect(() => context.inject('counter', {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
                expect(factory).toHaveBeenCalledTimes(3);
                expect(context.inject('counter', {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).toEqual(2);
                expect(factory).toHaveBeenCalledTimes(4);
                expect(context.inject('counter', {
                    qualifier: '1-step',
                })).toEqual(0);
                expect(factory).toHaveBeenCalledTimes(4);

                factory = createSpy('stringFactorySpy')
                    .and.returnValues(Promise.resolve(0), Promise.resolve(1), Promise.resolve(2));
                context = new Context().provide('counter', '1-step', factory);
                expect(factory).toHaveBeenCalledOnceWith(context);
                await expectAsync(context.inject('counter', {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).toBeResolvedTo(1);
                expect(factory).toHaveBeenCalledTimes(2);
                await expectAsync(context.inject('counter', {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).toBeResolvedTo(2);
                expect(factory).toHaveBeenCalledTimes(3);
                await expectAsync(context.inject('counter', {
                    qualifier: '1-step',
                })).toBeResolvedTo(0);
                expect(factory).toHaveBeenCalledTimes(3);

                factory = createSpy('stringFactorySpy').and.returnValues(Promise.resolve(0),
                    Promise.resolve(null), Promise.resolve(undefined), Promise.resolve(2));
                context = new Context().provide('counter', '1-step', factory);
                expect(factory).toHaveBeenCalledOnceWith(context);
                await expectAsync(context.inject('counter', {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).toBeRejectedWithError(new RegExp(`^${Context.ERR_EMPTY_VALUE}`));
                expect(factory).toHaveBeenCalledTimes(2);
                await expectAsync(context.inject('counter', {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).toBeRejectedWithError(new RegExp(`^${Context.ERR_EMPTY_VALUE}`));
                expect(factory).toHaveBeenCalledTimes(3);
                await expectAsync(context.inject('counter', {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).toBeResolvedTo(2);
                expect(factory).toHaveBeenCalledTimes(4);
                await expectAsync(context.inject('counter', {
                    qualifier: '1-step',
                })).toBeResolvedTo(0);
                expect(factory).toHaveBeenCalledTimes(4);
            });
        });

        describe('(token: Class)', () => {
            class Nothing {
                brand?: string;
            }

            it('return provided value', () => {
                const expected = new Nothing();
                expect(new Context()
                    .provide(Nothing, () => expected)
                    .inject(Nothing)
                ).toBe(expected);
            });

            it('return default qualified value', () => {
                const expected = new Nothing();
                expect(new Context()
                    .provide(Nothing, () => expected)
                    .provide(Nothing, 'home', () => new Nothing())
                    .inject(Nothing)
                ).toBe(expected);
                expect(new Context()
                    .provide(Nothing, 'home', () => expected)
                    .inject(Nothing)
                ).toBe(expected);
            });

            it('return default qualified value from ancestor WHEN not possible at descendant level', () => {
                const expected = new Nothing();
                expect(new Context(
                    new Context()
                        .provide(Nothing, () => expected))
                    .inject(Nothing)
                ).toBe(expected);
            });

            it('return cached factory-evaluated value', () => {
                const expected = new Nothing();
                const factory = createSpy('stringFactorySpy')
                    .and.returnValues(expected, new Nothing());
                const context = new Context().provide(Nothing, factory);

                expect(factory).toHaveBeenCalledOnceWith(context);
                expect(context.inject(Nothing)).toBe(expected);
                expect(factory).toHaveBeenCalledOnceWith(context);
                expect(context.inject(Nothing)).toBe(expected);
                expect(factory).toHaveBeenCalledOnceWith(context);

                const otherExpected = new Nothing();
                const otherFactory = createSpy('stringFactorySpy')
                    .and.returnValues(otherExpected, new Nothing());
                const otherContext = new Context().provide(Nothing, otherFactory);

                expect(otherFactory).toHaveBeenCalledOnceWith(otherContext);
                expect(otherContext.inject(Nothing)).toBe(otherExpected);
                expect(otherFactory).toHaveBeenCalledOnceWith(otherContext);
                expect(otherContext.inject(Nothing)).toBe(otherExpected);
                expect(otherFactory).toHaveBeenCalledOnceWith(otherContext);

                const anotherExpected = new Nothing();
                const anotherFactory = createSpy('stringFactorySpy')
                    .and.returnValues(anotherExpected, new Nothing());
                const anotherContext = new Context({
                    factory: {
                        lazyFunctionEvaluation: true,
                    }
                }).provide(Nothing, anotherFactory);

                expect(anotherFactory).not.toHaveBeenCalled();
                expect(anotherContext
                    .inject(Nothing)).toBe(anotherExpected);
                expect(anotherFactory).toHaveBeenCalledOnceWith(anotherContext);
                expect(anotherContext.inject(Nothing)).toBe(anotherExpected);
                expect(anotherFactory).toHaveBeenCalledOnceWith(anotherContext);
            });

            it('evaluate factory with invocation context', () => {
                const expected = new Nothing();
                const factory = createSpy('stringFactorySpy').and.returnValues(expected);
                const context = new Context(new Context()
                    .provide(Nothing, factory));

                context.inject(Nothing);
                expect(factory).toHaveBeenCalledOnceWith(context);
            });

            it('caches factory-evaluated value at bean definition context', () => {
                const expected = new Nothing();
                const factory = createSpy('stringFactorySpy').and.returnValues(expected);
                const parent = new Context().provide(Nothing, factory);
                const context = new Context(parent);

                expect(context.inject(Nothing)).toBe(expected);
                expect(factory).toHaveBeenCalledOnceWith(context);
                expect(parent.inject(Nothing)).toBe(expected);
                expect(factory).toHaveBeenCalledOnceWith(context);
            });

            it('fail WHEN factory-evaluated value is empty', () => {
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                })
                    .provide(Nothing, () => null as any as Nothing)
                    .inject(Nothing)).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
                expect(() => new Context({
                    factory: {
                        lazyFunctionEvaluation: true,
                    }
                })
                    .provide(Nothing, () => null as any as Nothing)
                    .inject(Nothing)).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                })
                    .provide(Nothing, () => undefined as any as Nothing)
                    .inject(Nothing)).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
                expect(() => new Context({
                    factory: {
                        lazyFunctionEvaluation: true,
                    }
                })
                    .provide(Nothing, () => undefined as any as Nothing)
                    .inject(Nothing)).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
            });

            it('fail WHEN there is undecidable bean at any level of contexts', () => {
                const expected = new Nothing();
                expect(() => new Context(
                    new Context()
                        .provide(Nothing, () => expected))
                    .provide(Nothing, 'home', () => new Nothing())
                    .provide(Nothing, 'work', () => new Nothing())
                    .inject(Nothing)).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_UNDECIDABLE_BEAN));
            });

            it('fail WHEN no bean definition the tree has been provided', () => {
                expect(() => new Context().inject('home')).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_MISSING_TOKEN));
            });
        });

        describe('(token: Class, qualifier: string)', () => {
            class Building {
                street?: string;
                number?: number;
            }

            it('return provided value', () => {
                const expected = new Building();
                expect(new Context()
                    .provide(Building, () => expected)
                    .inject(Building)
                ).toBe(expected);
            });

            it('return default qualified value', () => {
                const expected = new Building();
                expect(new Context()
                    .provide(Building, () => expected)
                    .provide(Building, 'home', () => new Building())
                    .inject(Building)
                ).toBe(expected);
                expect(new Context()
                    .provide(Building, 'home', () => expected)
                    .inject(Building)
                ).toBe(expected);
            });

            it('return default qualified value from ancestor WHEN not possible at descendant level', () => {
                const expected = new Building();
                expect(new Context(
                    new Context()
                        .provide(Building, 'home', () => expected))
                    .inject(Building, 'home')
                ).toBe(expected);
            });

            it('return cached factory-evaluated value', () => {
                const expected = new Building();
                const factory = createSpy('stringFactorySpy')
                    .and.returnValues(expected, new Building());
                const context = new Context().provide(Building, 'home', factory);

                expect(factory).toHaveBeenCalledOnceWith(context);
                expect(context.inject(Building, 'home')).toBe(expected);
                expect(factory).toHaveBeenCalledOnceWith(context);
                expect(context.inject(Building, 'home')).toBe(expected);
                expect(factory).toHaveBeenCalledOnceWith(context);

                const otherExpected = new Building();
                const otherFactory = createSpy('stringFactorySpy')
                    .and.returnValues(otherExpected, new Building());
                const otherContext = new Context().provide(Building, 'home', otherFactory);

                expect(otherFactory).toHaveBeenCalledOnceWith(otherContext);
                expect(otherContext.inject(Building, 'home')).toBe(otherExpected);
                expect(otherFactory).toHaveBeenCalledOnceWith(otherContext);
                expect(otherContext.inject(Building, 'home')).toBe(otherExpected);
                expect(otherFactory).toHaveBeenCalledOnceWith(otherContext);

                const anotherExpected = new Building();
                const anotherFactory = createSpy('stringFactorySpy')
                    .and.returnValues(anotherExpected, new Building());
                const anotherContext = new Context({
                    factory: {
                        lazyFunctionEvaluation: true,
                    }
                }).provide(Building, 'home', anotherFactory);

                expect(anotherFactory).not.toHaveBeenCalled();
                expect(anotherContext
                    .inject(Building, 'home')).toBe(anotherExpected);
                expect(anotherFactory).toHaveBeenCalledOnceWith(anotherContext);
                expect(anotherContext.inject(Building, 'home')).toBe(anotherExpected);
                expect(anotherFactory).toHaveBeenCalledOnceWith(anotherContext);
            });

            it('evaluate factory with invocation context', () => {
                const expected = new Building();
                const factory = createSpy('stringFactorySpy').and.returnValues(expected);
                const context = new Context(new Context()
                    .provide(Building, 'home', factory));

                context.inject(Building, 'home');
                expect(factory).toHaveBeenCalledOnceWith(context);
            });

            it('caches factory-evaluated value at bean definition context', () => {
                const expected = new Building();
                const factory = createSpy('stringFactorySpy').and.returnValues(expected);
                const parent = new Context().provide(Building, 'home', factory);
                const context = new Context(parent);

                expect(context.inject(Building, 'home')).toBe(expected);
                expect(factory).toHaveBeenCalledOnceWith(context);
                expect(parent.inject(Building, 'home')).toBe(expected);
                expect(factory).toHaveBeenCalledOnceWith(context);
            });

            it('fail WHEN factory-evaluated value is empty', () => {
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                })
                    .provide(Building, 'home', () => null as any as Building)
                    .inject(Building, 'home')).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
                expect(() => new Context({
                    factory: {
                        lazyFunctionEvaluation: true,
                    }
                })
                    .provide(Building, 'home', () => null as any as Building)
                    .inject(Building, 'home')).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                })
                    .provide(Building, 'home', () => undefined as any as Building)
                    .inject(Building, 'home')).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
                expect(() => new Context({
                    factory: {
                        lazyFunctionEvaluation: true,
                    }
                })
                    .provide(Building, 'home', () => undefined as any as Building)
                    .inject(Building, 'home')).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
            });

            it('fail WHEN no bean definition the tree has been provided', () => {
                expect(() => new Context().inject(Building, 'home')).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_MISSING_TOKEN));
            });
        });

        describe('(token: Class, injectOptions)', () => {
            class Building {
                street?: string;
                number?: number;
            }

            it('resolve bean', async () => {
                const expected = new Building();
                expect(new Context()
                    .provide(Building, expected)
                    .inject(Building, {})
                ).toBe(expected);
                expect(new Context()
                    .provide(Building, () => expected)
                    .inject(Building, {})
                ).toBe(expected);

                expect(new Context()
                    .provide(Building, 'work', expected)
                    .inject(Building, {qualifier: 'work'})
                ).toBe(expected);
                expect(new Context()
                    .provide(Building, 'work', () => expected)
                    .inject(Building, {qualifier: 'work'})
                ).toBe(expected);

                let context = new Context();
                let factory = createSpy('stringFactorySpy').and.returnValue(expected);
                expect(context
                    .provide(Building, 'work', factory)
                    .inject(Building, {qualifier: 'work', forceEvaluation: false})
                ).toBe(expected);
                expect(factory).toHaveBeenCalledOnceWith(context);
                context = new Context();
                factory = createSpy('stringFactorySpy').and.resolveTo(expected);
                await expectAsync(new Context()
                    .provide(Building, 'work', factory)
                    .inject(Building, {qualifier: 'work', forceEvaluation: false})
                ).toBeResolvedTo(expected);
                expect(factory).toHaveBeenCalledOnceWith(context);
            });

            it('fail WHEN value is empty', async () => {
                expect(() => new Context({factory: {lazyValidation: true}})
                    .provide(Building, null as any as Building)
                    .inject(Building, {})).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_MISSING_TOKEN));
                expect(() => new Context({factory: {lazyValidation: true}})
                    .provide(Building, undefined as any as Building)
                    .inject(Building, {})).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_MISSING_TOKEN));

                expect(() => new Context({factory: {lazyFunctionEvaluation: true}})
                    .provide(Building, 'home', () => null as any as Building)
                    .inject(Building, {qualifier: 'home'})).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
                expect(() => new Context({factory: {lazyFunctionEvaluation: true}})
                    .provide(Building, 'home', () => undefined as any as Building)
                    .inject(Building, {qualifier: 'home'})).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));

                let context = new Context();
                let factory = createSpy('stringFactorySpy').and.resolveTo(null);
                await expectAsync(context
                    .provide(Building, 'work', factory)
                    .inject(Building, {qualifier: 'work', forceEvaluation: false})
                ).toBeRejectedWithError(new RegExp(`^${Context.ERR_EMPTY_VALUE}`));
                expect(factory).toHaveBeenCalledOnceWith(context);
                context = new Context();
                factory = createSpy('stringFactorySpy').and.resolveTo(undefined);
                await expectAsync(new Context()
                    .provide(Building, 'work', factory)
                    .inject(Building, {qualifier: 'work', forceEvaluation: false})
                ).toBeRejectedWithError(new RegExp(`^${Context.ERR_EMPTY_VALUE}`));
                expect(factory).toHaveBeenCalledOnceWith(context);
            });

            it('revaluate factory and validate value WHEN injectOptions.forceEvaluation === true, without caching the result', async () => {
                const [ZERO, ONE, TWO] = [new Building(), new Building(), new Building()];
                let factory = createSpy('stringFactorySpy').and.returnValues(ZERO, ONE, TWO);
                let context = new Context().provide(Building, factory);
                expect(factory).toHaveBeenCalledOnceWith(context);
                expect(context.inject(Building, {
                    forceEvaluation: true,
                })).toBe(ONE);
                expect(factory).toHaveBeenCalledTimes(2);
                expect(context.inject(Building, {
                    forceEvaluation: true,
                })).toBe(TWO);
                expect(factory).toHaveBeenCalledTimes(3);
                expect(context.inject(Building, {})).toBe(ZERO);
                expect(factory).toHaveBeenCalledTimes(3);

                factory = createSpy('stringFactorySpy').and.returnValues(ZERO, null, undefined, TWO);
                context = new Context().provide(Building, factory);
                expect(factory).toHaveBeenCalledOnceWith(context);
                expect(() => context.inject(Building, {
                    forceEvaluation: true,
                })).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
                expect(factory).toHaveBeenCalledTimes(2);
                expect(() => context.inject(Building, {
                    forceEvaluation: true,
                })).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
                expect(factory).toHaveBeenCalledTimes(3);
                expect(context.inject(Building, {
                    forceEvaluation: true,
                })).toBe(TWO);
                expect(factory).toHaveBeenCalledTimes(4);
                expect(context.inject(Building, {})).toBe(ZERO);
                expect(factory).toHaveBeenCalledTimes(4);

                factory = createSpy('stringFactorySpy').and.returnValues(Promise.resolve(ZERO),
                    Promise.resolve(ONE), Promise.resolve(TWO));
                context = new Context().provide(Building, factory);
                expect(factory).toHaveBeenCalledOnceWith(context);
                await expectAsync(context.inject(Building, {
                    forceEvaluation: true,
                })).toBeResolvedTo(ONE);
                expect(factory).toHaveBeenCalledTimes(2);
                await expectAsync(context.inject(Building, {
                    forceEvaluation: true,
                })).toBeResolvedTo(TWO);
                expect(factory).toHaveBeenCalledTimes(3);
                await expectAsync(context.inject(Building, {})).toBeResolvedTo(ZERO);
                expect(factory).toHaveBeenCalledTimes(3);

                factory = createSpy('stringFactorySpy').and.returnValues(Promise.resolve(ZERO),
                    Promise.resolve(null), Promise.resolve(undefined), Promise.resolve(TWO));
                context = new Context().provide(Building, factory);
                expect(factory).toHaveBeenCalledOnceWith(context);
                await expectAsync(context.inject(Building, {
                    forceEvaluation: true,
                })).toBeRejectedWithError(new RegExp(`^${Context.ERR_EMPTY_VALUE}`));
                expect(factory).toHaveBeenCalledTimes(2);
                await expectAsync(context.inject(Building, {
                    forceEvaluation: true,
                })).toBeRejectedWithError(new RegExp(`^${Context.ERR_EMPTY_VALUE}`));
                expect(factory).toHaveBeenCalledTimes(3);
                await expectAsync(context.inject(Building, {
                    forceEvaluation: true,
                })).toBeResolvedTo(TWO);
                expect(factory).toHaveBeenCalledTimes(4);
                await expectAsync(context.inject(Building, {})).toBeResolvedTo(ZERO);
                expect(factory).toHaveBeenCalledTimes(4);


                factory = createSpy('stringFactorySpy').and.returnValues(ZERO, ONE, TWO);
                context = new Context().provide(Building, '1-step', factory);
                expect(factory).toHaveBeenCalledOnceWith(context);
                expect(context.inject(Building, {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).toEqual(ONE);
                expect(factory).toHaveBeenCalledTimes(2);
                expect(context.inject(Building, {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).toEqual(TWO);
                expect(factory).toHaveBeenCalledTimes(3);
                expect(context.inject(Building, {
                    qualifier: '1-step',
                })).toEqual(ZERO);
                expect(factory).toHaveBeenCalledTimes(3);

                factory = createSpy('stringFactorySpy').and.returnValues(ZERO, null, undefined, TWO);
                context = new Context().provide(Building, '1-step', factory);
                expect(factory).toHaveBeenCalledOnceWith(context);
                expect(() => context.inject(Building, {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
                expect(factory).toHaveBeenCalledTimes(2);
                expect(() => context.inject(Building, {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
                expect(factory).toHaveBeenCalledTimes(3);
                expect(context.inject(Building, {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).toEqual(TWO);
                expect(factory).toHaveBeenCalledTimes(4);
                expect(context.inject(Building, {
                    qualifier: '1-step',
                })).toEqual(ZERO);
                expect(factory).toHaveBeenCalledTimes(4);

                factory = createSpy('stringFactorySpy')
                    .and.returnValues(Promise.resolve(ZERO), Promise.resolve(ONE), Promise.resolve(TWO));
                context = new Context().provide(Building, '1-step', factory);
                expect(factory).toHaveBeenCalledOnceWith(context);
                await expectAsync(context.inject(Building, {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).toBeResolvedTo(ONE);
                expect(factory).toHaveBeenCalledTimes(2);
                await expectAsync(context.inject(Building, {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).toBeResolvedTo(TWO);
                expect(factory).toHaveBeenCalledTimes(3);
                await expectAsync(context.inject(Building, {
                    qualifier: '1-step',
                })).toBeResolvedTo(ZERO);
                expect(factory).toHaveBeenCalledTimes(3);

                factory = createSpy('stringFactorySpy').and.returnValues(Promise.resolve(ZERO),
                    Promise.resolve(null), Promise.resolve(undefined), Promise.resolve(TWO));
                context = new Context().provide(Building, '1-step', factory);
                expect(factory).toHaveBeenCalledOnceWith(context);
                await expectAsync(context.inject(Building, {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).toBeRejectedWithError(new RegExp(`^${Context.ERR_EMPTY_VALUE}`));
                expect(factory).toHaveBeenCalledTimes(2);
                await expectAsync(context.inject(Building, {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).toBeRejectedWithError(new RegExp(`^${Context.ERR_EMPTY_VALUE}`));
                expect(factory).toHaveBeenCalledTimes(3);
                await expectAsync(context.inject(Building, {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).toBeResolvedTo(TWO);
                expect(factory).toHaveBeenCalledTimes(4);
                await expectAsync(context.inject(Building, {
                    qualifier: '1-step',
                })).toBeResolvedTo(ZERO);
                expect(factory).toHaveBeenCalledTimes(4);
            });
        });

        describe('(token: Context.Token)', () => {
            const NOTHING: Context.Token<Nothing> = Symbol('NOTHING');

            class Nothing {
                brand?: string;
            }

            it('return provided value', () => {
                const expected = new Nothing();
                expect(new Context()
                    .provide(NOTHING, () => expected)
                    .inject(NOTHING)
                ).toBe(expected);
            });

            it('return default qualified value', () => {
                const expected = new Nothing();
                expect(new Context()
                    .provide(NOTHING, () => expected)
                    .provide(NOTHING, 'home', () => new Nothing())
                    .inject(NOTHING)
                ).toBe(expected);
                expect(new Context()
                    .provide(NOTHING, 'home', () => expected)
                    .inject(NOTHING)
                ).toBe(expected);
            });

            it('return default qualified value from ancestor WHEN not possible at descendant level', () => {
                const expected = new Nothing();
                expect(new Context(
                    new Context()
                        .provide(NOTHING, () => expected))
                    .inject(NOTHING)
                ).toBe(expected);
            });

            it('return cached factory-evaluated value', () => {
                const expected = new Nothing();
                const factory = createSpy('stringFactorySpy')
                    .and.returnValues(expected, new Nothing());
                const context = new Context().provide(NOTHING, factory);

                expect(factory).toHaveBeenCalledOnceWith(context);
                expect(context.inject(NOTHING)).toBe(expected);
                expect(factory).toHaveBeenCalledOnceWith(context);
                expect(context.inject(NOTHING)).toBe(expected);
                expect(factory).toHaveBeenCalledOnceWith(context);

                const otherExpected = new Nothing();
                const otherFactory = createSpy('stringFactorySpy')
                    .and.returnValues(otherExpected, new Nothing());
                const otherContext = new Context().provide(NOTHING, otherFactory);

                expect(otherFactory).toHaveBeenCalledOnceWith(otherContext);
                expect(otherContext.inject(NOTHING)).toBe(otherExpected);
                expect(otherFactory).toHaveBeenCalledOnceWith(otherContext);
                expect(otherContext.inject(NOTHING)).toBe(otherExpected);
                expect(otherFactory).toHaveBeenCalledOnceWith(otherContext);

                const anotherExpected = new Nothing();
                const anotherFactory = createSpy('stringFactorySpy')
                    .and.returnValues(anotherExpected, new Nothing());
                const anotherContext = new Context({
                    factory: {
                        lazyFunctionEvaluation: true,
                    }
                }).provide(NOTHING, anotherFactory);

                expect(anotherFactory).not.toHaveBeenCalled();
                expect(anotherContext
                    .inject(NOTHING)).toBe(anotherExpected);
                expect(anotherFactory).toHaveBeenCalledOnceWith(anotherContext);
                expect(anotherContext.inject(NOTHING)).toBe(anotherExpected);
                expect(anotherFactory).toHaveBeenCalledOnceWith(anotherContext);
            });

            it('evaluate factory with invocation context', () => {
                const expected = new Nothing();
                const factory = createSpy('stringFactorySpy').and.returnValues(expected);
                const context = new Context(new Context()
                    .provide(NOTHING, factory));

                context.inject(NOTHING);
                expect(factory).toHaveBeenCalledOnceWith(context);
            });

            it('caches factory-evaluated value at bean definition context', () => {
                const expected = new Nothing();
                const factory = createSpy('stringFactorySpy').and.returnValues(expected);
                const parent = new Context().provide(NOTHING, factory);
                const context = new Context(parent);

                expect(context.inject(NOTHING)).toBe(expected);
                expect(factory).toHaveBeenCalledOnceWith(context);
                expect(parent.inject(NOTHING)).toBe(expected);
                expect(factory).toHaveBeenCalledOnceWith(context);
            });

            it('fail WHEN factory-evaluated value is empty', () => {
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                })
                    .provide(NOTHING, () => null as any as Nothing)
                    .inject(NOTHING)).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
                expect(() => new Context({
                    factory: {
                        lazyFunctionEvaluation: true,
                    }
                })
                    .provide(NOTHING, () => null as any as Nothing)
                    .inject(NOTHING)).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                })
                    .provide(NOTHING, () => undefined as any as Nothing)
                    .inject(NOTHING)).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
                expect(() => new Context({
                    factory: {
                        lazyFunctionEvaluation: true,
                    }
                })
                    .provide(NOTHING, () => undefined as any as Nothing)
                    .inject(NOTHING)).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
            });

            it('fail WHEN promise-resolved value is empty', async () => {
                const NOTHING_PROMISE: Context.Token<Promise<Nothing>> = Symbol('NOTHING_PROMISE');
                await expectAsync(new Context()
                    .provide(NOTHING_PROMISE, Promise.resolve(null as any as Nothing))
                    .inject(NOTHING_PROMISE)
                ).toBeRejectedWithError(new RegExp(`^${Context.ERR_EMPTY_VALUE}`));
                await expectAsync(new Context()
                    .provide(NOTHING_PROMISE, Promise.resolve(undefined as any as Nothing))
                    .inject(NOTHING_PROMISE)
                ).toBeRejectedWithError(new RegExp(`^${Context.ERR_EMPTY_VALUE}`));

                const expected = new Nothing();
                await expectAsync(new Context()
                    .provide(NOTHING_PROMISE, Promise.resolve(expected))
                    .inject(NOTHING_PROMISE)
                ).toBeResolvedTo(expected);
            });

            it('fail WHEN factory-evaluated promise value is empty', async () => {
                const NOTHING_PROMISE: Context.Token<Promise<Nothing>> = Symbol('NOTHING_PROMISE');
                await expectAsync(new Context()
                    .provide(NOTHING_PROMISE, () => Promise.resolve(null as any as Nothing))
                    .inject(NOTHING_PROMISE)
                ).toBeRejectedWithError(new RegExp(`^${Context.ERR_EMPTY_VALUE}`));
                await expectAsync(new Context()
                    .provide(NOTHING_PROMISE, () => Promise.resolve(undefined as any as Nothing))
                    .inject(NOTHING_PROMISE)
                ).toBeRejectedWithError(new RegExp(`^${Context.ERR_EMPTY_VALUE}`));

                const expected = new Nothing();
                await expectAsync(new Context()
                    .provide(NOTHING_PROMISE, () => Promise.resolve(expected))
                    .inject(NOTHING_PROMISE)
                ).toBeResolvedTo(expected);
            });

            it('fail WHEN there is undecidable bean at any level of contexts', () => {
                const expected = new Nothing();
                expect(() => new Context(
                    new Context()
                        .provide(NOTHING, () => expected))
                    .provide(NOTHING, 'home', () => new Nothing())
                    .provide(NOTHING, 'work', () => new Nothing())
                    .inject(NOTHING)).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_UNDECIDABLE_BEAN));
            });

            it('fail WHEN no bean definition the tree has been provided', () => {
                expect(() => new Context().inject('home')).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_MISSING_TOKEN));
            });
        });

        describe('(token: Context.Token, qualifier: string)', () => {
            const BUILDING: Context.Token<Building> = Symbol('BUILDING');

            class Building {
                street?: string;
                number?: number;
            }

            it('return provided value', () => {
                const expected = new Building();
                expect(new Context()
                    .provide(BUILDING, () => expected)
                    .inject(BUILDING)
                ).toBe(expected);
            });

            it('return default qualified value', () => {
                const expected = new Building();
                expect(new Context()
                    .provide(BUILDING, () => expected)
                    .provide(BUILDING, 'home', () => new Building())
                    .inject(BUILDING)
                ).toBe(expected);
                expect(new Context()
                    .provide(BUILDING, 'home', () => expected)
                    .inject(BUILDING)
                ).toBe(expected);
            });

            it('return default qualified value from ancestor WHEN not possible at descendant level', () => {
                const expected = new Building();
                expect(new Context(
                    new Context()
                        .provide(BUILDING, 'home', () => expected))
                    .inject(BUILDING, 'home')
                ).toBe(expected);
            });

            it('return cached factory-evaluated value', () => {
                const expected = new Building();
                const factory = createSpy('stringFactorySpy')
                    .and.returnValues(expected, new Building());
                const context = new Context().provide(BUILDING, 'home', factory);

                expect(factory).toHaveBeenCalledOnceWith(context);
                expect(context.inject(BUILDING, 'home')).toBe(expected);
                expect(factory).toHaveBeenCalledOnceWith(context);
                expect(context.inject(BUILDING, 'home')).toBe(expected);
                expect(factory).toHaveBeenCalledOnceWith(context);

                const otherExpected = new Building();
                const otherFactory = createSpy('stringFactorySpy')
                    .and.returnValues(otherExpected, new Building());
                const otherContext = new Context().provide(BUILDING, 'home', otherFactory);

                expect(otherFactory).toHaveBeenCalledOnceWith(otherContext);
                expect(otherContext.inject(BUILDING, 'home')).toBe(otherExpected);
                expect(otherFactory).toHaveBeenCalledOnceWith(otherContext);
                expect(otherContext.inject(BUILDING, 'home')).toBe(otherExpected);
                expect(otherFactory).toHaveBeenCalledOnceWith(otherContext);

                const anotherExpected = new Building();
                const anotherFactory = createSpy('stringFactorySpy')
                    .and.returnValues(anotherExpected, new Building());
                const anotherContext = new Context({
                    factory: {
                        lazyFunctionEvaluation: true,
                    }
                }).provide(BUILDING, 'home', anotherFactory);

                expect(anotherFactory).not.toHaveBeenCalled();
                expect(anotherContext
                    .inject(BUILDING, 'home')).toBe(anotherExpected);
                expect(anotherFactory).toHaveBeenCalledOnceWith(anotherContext);
                expect(anotherContext.inject(BUILDING, 'home')).toBe(anotherExpected);
                expect(anotherFactory).toHaveBeenCalledOnceWith(anotherContext);
            });

            it('evaluate factory with invocation context', () => {
                const expected = new Building();
                const factory = createSpy('stringFactorySpy').and.returnValues(expected);
                const context = new Context(new Context()
                    .provide(BUILDING, 'home', factory));

                context.inject(BUILDING, 'home');
                expect(factory).toHaveBeenCalledOnceWith(context);
            });

            it('caches factory-evaluated value at bean definition context', () => {
                const expected = new Building();
                const factory = createSpy('stringFactorySpy').and.returnValues(expected);
                const parent = new Context().provide(BUILDING, 'home', factory);
                const context = new Context(parent);

                expect(context.inject(BUILDING, 'home')).toBe(expected);
                expect(factory).toHaveBeenCalledOnceWith(context);
                expect(parent.inject(BUILDING, 'home')).toBe(expected);
                expect(factory).toHaveBeenCalledOnceWith(context);
            });

            it('fail WHEN factory-evaluated value is empty', () => {
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                })
                    .provide(BUILDING, 'home', () => null as any as Building)
                    .inject(BUILDING, 'home')).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
                expect(() => new Context({
                    factory: {
                        lazyFunctionEvaluation: true,
                    }
                })
                    .provide(BUILDING, 'home', () => null as any as Building)
                    .inject(BUILDING, 'home')).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                })
                    .provide(BUILDING, 'home', () => undefined as any as Building)
                    .inject(BUILDING, 'home')).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
                expect(() => new Context({
                    factory: {
                        lazyFunctionEvaluation: true,
                    }
                })
                    .provide(BUILDING, 'home', () => undefined as any as Building)
                    .inject(BUILDING, 'home')).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
            });

            it('fail WHEN promise-resolved value is empty', async () => {
                const BUILDING_PROMISE: Context.Token<Promise<Building>> = Symbol('BUILDING_PROMISE');
                await expectAsync(new Context()
                    .provide(BUILDING_PROMISE, 'home', Promise.resolve(null as any as Building))
                    .inject(BUILDING_PROMISE, 'home')
                ).toBeRejectedWithError(new RegExp(`^${Context.ERR_EMPTY_VALUE}`));
                await expectAsync(new Context()
                    .provide(BUILDING_PROMISE, 'home', Promise.resolve(undefined as any as Building))
                    .inject(BUILDING_PROMISE, 'home')
                ).toBeRejectedWithError(new RegExp(`^${Context.ERR_EMPTY_VALUE}`));

                const expected = new Building();
                await expectAsync(new Context()
                    .provide(BUILDING_PROMISE, 'home', Promise.resolve(expected))
                    .inject(BUILDING_PROMISE, 'home')
                ).toBeResolvedTo(expected);
            });

            it('fail WHEN factory-evaluated promise value is empty', async () => {
                const BUILDING_PROMISE: Context.Token<Promise<Building>> = Symbol('BUILDING_PROMISE');
                await expectAsync(new Context()
                    .provide(BUILDING_PROMISE, 'home', () => Promise.resolve(null as any as Building))
                    .inject(BUILDING_PROMISE, 'home')
                ).toBeRejectedWithError(new RegExp(`^${Context.ERR_EMPTY_VALUE}`));
                await expectAsync(new Context()
                    .provide(BUILDING_PROMISE, 'home', () => Promise.resolve(undefined as any as Building))
                    .inject(BUILDING_PROMISE, 'home')
                ).toBeRejectedWithError(new RegExp(`^${Context.ERR_EMPTY_VALUE}`));

                const expected = new Building();
                await expectAsync(new Context()
                    .provide(BUILDING_PROMISE, 'home', () => Promise.resolve(expected))
                    .inject(BUILDING_PROMISE, 'home')
                ).toBeResolvedTo(expected);
            });

            it('fail WHEN no bean definition the tree has been provided', () => {
                expect(() => new Context().inject(BUILDING, 'home')).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_MISSING_TOKEN));
            });
        });

        describe('(token: Context.Token, injectOptions)', () => {
            const BUILDING_PROMISE: Context.Token<Promise<Building>> = Symbol('BUILDING_PROMISE');
            const BUILDING: Context.Token<Building> = Symbol('BUILDING');

            class Building {
                street?: string;
                number?: number;
            }

            it('resolve bean', async () => {
                const expected = new Building();
                expect(new Context()
                    .provide(BUILDING, () => expected)
                    .inject(BUILDING, {})
                ).toBe(expected);
                await expectAsync(new Context()
                    .provide(BUILDING_PROMISE, () => Promise.resolve(expected))
                    .inject(BUILDING_PROMISE, {})
                ).toBeResolvedTo(expected);

                expect(new Context()
                    .provide(BUILDING, 'work', () => expected)
                    .inject(BUILDING, {qualifier: 'work'})
                ).toBe(expected);
                await expectAsync(new Context()
                    .provide(BUILDING_PROMISE, 'work', () => Promise.resolve(expected))
                    .inject(BUILDING_PROMISE, {qualifier: 'work'})
                ).toBeResolvedTo(expected);

                let context = new Context();
                let factory = createSpy('stringFactorySpy').and.returnValue(expected);
                expect(context
                    .provide(BUILDING, 'work', factory)
                    .inject(BUILDING, {qualifier: 'work', forceEvaluation: false})
                ).toBe(expected);
                expect(factory).toHaveBeenCalledOnceWith(context);
                context = new Context();
                factory = createSpy('stringFactorySpy').and.resolveTo(expected);
                await expectAsync(new Context()
                    .provide(BUILDING, 'work', factory)
                    .inject(BUILDING, {qualifier: 'work', forceEvaluation: false})
                ).toBeResolvedTo(expected);
                expect(factory).toHaveBeenCalledOnceWith(context);
            });

            it('fail WHEN value is empty', async () => {
                expect(() => new Context({factory: {lazyFunctionEvaluation: true}})
                    .provide(BUILDING, () => null as any as Building)
                    .inject(BUILDING, {})).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
                expect(() => new Context({factory: {lazyFunctionEvaluation: true}})
                    .provide(BUILDING, () => undefined as any as Building)
                    .inject(BUILDING, {})).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));

                expect(() => new Context({factory: {lazyFunctionEvaluation: true}})
                    .provide(BUILDING, 'home', () => null as any as Building)
                    .inject(BUILDING, {qualifier: 'home'})).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
                expect(() => new Context({factory: {lazyFunctionEvaluation: true}})
                    .provide(BUILDING, 'home', () => undefined as any as Building)
                    .inject(BUILDING, {qualifier: 'home'})).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));


                await expectAsync(new Context({factory: {lazyFunctionEvaluation: true}})
                    .provide(BUILDING_PROMISE, () => Promise.resolve(null as any as Building))
                    .inject(BUILDING_PROMISE, {})
                ).toBeRejectedWithError(new RegExp(`^${Context.ERR_EMPTY_VALUE}`));
                await expectAsync(new Context({factory: {lazyFunctionEvaluation: true}})
                    .provide(BUILDING_PROMISE, () => Promise.resolve(undefined as any as Building))
                    .inject(BUILDING_PROMISE, {})
                ).toBeRejectedWithError(new RegExp(`^${Context.ERR_EMPTY_VALUE}`));

                let context = new Context();
                let factory = createSpy('stringFactorySpy').and.resolveTo(null);
                await expectAsync(context
                    .provide(BUILDING, 'work', factory)
                    .inject(BUILDING, {qualifier: 'work', forceEvaluation: false})
                ).toBeRejectedWithError(new RegExp(`^${Context.ERR_EMPTY_VALUE}`));
                expect(factory).toHaveBeenCalledOnceWith(context);
                context = new Context();
                factory = createSpy('stringFactorySpy').and.resolveTo(undefined);
                await expectAsync(new Context()
                    .provide(BUILDING, 'work', factory)
                    .inject(BUILDING, {qualifier: 'work', forceEvaluation: false})
                ).toBeRejectedWithError(new RegExp(`^${Context.ERR_EMPTY_VALUE}`));
                expect(factory).toHaveBeenCalledOnceWith(context);
            });

            it('revaluate factory and validate value WHEN injectOptions.forceEvaluation === true, without caching the result', async () => {
                const [ZERO, ONE, TWO] = [new Building(), new Building(), new Building()];
                let factory = createSpy('stringFactorySpy').and.returnValues(ZERO, ONE, TWO);
                let context = new Context().provide(BUILDING, factory);
                expect(factory).toHaveBeenCalledOnceWith(context);
                expect(context.inject(BUILDING, {
                    forceEvaluation: true,
                })).toBe(ONE);
                expect(factory).toHaveBeenCalledTimes(2);
                expect(context.inject(BUILDING, {
                    forceEvaluation: true,
                })).toBe(TWO);
                expect(factory).toHaveBeenCalledTimes(3);
                expect(context.inject(BUILDING, {})).toBe(ZERO);
                expect(factory).toHaveBeenCalledTimes(3);

                factory = createSpy('stringFactorySpy').and.returnValues(ZERO, null, undefined, TWO);
                context = new Context().provide(BUILDING, factory);
                expect(factory).toHaveBeenCalledOnceWith(context);
                expect(() => context.inject(BUILDING, {
                    forceEvaluation: true,
                })).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
                expect(factory).toHaveBeenCalledTimes(2);
                expect(() => context.inject(BUILDING, {
                    forceEvaluation: true,
                })).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
                expect(factory).toHaveBeenCalledTimes(3);
                expect(context.inject(BUILDING, {
                    forceEvaluation: true,
                })).toBe(TWO);
                expect(factory).toHaveBeenCalledTimes(4);
                expect(context.inject(BUILDING, {})).toBe(ZERO);
                expect(factory).toHaveBeenCalledTimes(4);

                factory = createSpy('stringFactorySpy').and.returnValues(Promise.resolve(ZERO),
                    Promise.resolve(ONE), Promise.resolve(TWO));
                context = new Context().provide(BUILDING_PROMISE, factory);
                expect(factory).toHaveBeenCalledOnceWith(context);
                await expectAsync(context.inject(BUILDING_PROMISE, {
                    forceEvaluation: true,
                })).toBeResolvedTo(ONE);
                expect(factory).toHaveBeenCalledTimes(2);
                await expectAsync(context.inject(BUILDING_PROMISE, {
                    forceEvaluation: true,
                })).toBeResolvedTo(TWO);
                expect(factory).toHaveBeenCalledTimes(3);
                await expectAsync(context.inject(BUILDING_PROMISE, {})).toBeResolvedTo(ZERO);
                expect(factory).toHaveBeenCalledTimes(3);

                factory = createSpy('stringFactorySpy').and.returnValues(Promise.resolve(ZERO),
                    Promise.resolve(null), Promise.resolve(undefined), Promise.resolve(TWO));
                context = new Context().provide(BUILDING_PROMISE, factory);
                expect(factory).toHaveBeenCalledOnceWith(context);
                await expectAsync(context.inject(BUILDING_PROMISE, {
                    forceEvaluation: true,
                })).toBeRejectedWithError(new RegExp(`^${Context.ERR_EMPTY_VALUE}`));
                expect(factory).toHaveBeenCalledTimes(2);
                await expectAsync(context.inject(BUILDING_PROMISE, {
                    forceEvaluation: true,
                })).toBeRejectedWithError(new RegExp(`^${Context.ERR_EMPTY_VALUE}`));
                expect(factory).toHaveBeenCalledTimes(3);
                await expectAsync(context.inject(BUILDING_PROMISE, {
                    forceEvaluation: true,
                })).toBeResolvedTo(TWO);
                expect(factory).toHaveBeenCalledTimes(4);
                await expectAsync(context.inject(BUILDING_PROMISE, {})).toBeResolvedTo(ZERO);
                expect(factory).toHaveBeenCalledTimes(4);


                factory = createSpy('stringFactorySpy').and.returnValues(ZERO, ONE, TWO);
                context = new Context().provide(BUILDING, '1-step', factory);
                expect(factory).toHaveBeenCalledOnceWith(context);
                expect(context.inject(BUILDING, {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).toEqual(ONE);
                expect(factory).toHaveBeenCalledTimes(2);
                expect(context.inject(BUILDING, {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).toEqual(TWO);
                expect(factory).toHaveBeenCalledTimes(3);
                expect(context.inject(BUILDING, {
                    qualifier: '1-step',
                })).toEqual(ZERO);
                expect(factory).toHaveBeenCalledTimes(3);

                factory = createSpy('stringFactorySpy').and.returnValues(ZERO, null, undefined, TWO);
                context = new Context().provide(BUILDING, '1-step', factory);
                expect(factory).toHaveBeenCalledOnceWith(context);
                expect(() => context.inject(BUILDING, {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
                expect(factory).toHaveBeenCalledTimes(2);
                expect(() => context.inject(BUILDING, {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).toThrowMatching(thrown =>
                    thrown instanceof Error && thrown.message.startsWith(Context.ERR_EMPTY_VALUE));
                expect(factory).toHaveBeenCalledTimes(3);
                expect(context.inject(BUILDING, {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).toEqual(TWO);
                expect(factory).toHaveBeenCalledTimes(4);
                expect(context.inject(BUILDING, {
                    qualifier: '1-step',
                })).toEqual(ZERO);
                expect(factory).toHaveBeenCalledTimes(4);

                factory = createSpy('stringFactorySpy')
                    .and.returnValues(Promise.resolve(ZERO), Promise.resolve(ONE), Promise.resolve(TWO));
                context = new Context().provide(BUILDING_PROMISE, '1-step', factory);
                expect(factory).toHaveBeenCalledOnceWith(context);
                await expectAsync(context.inject(BUILDING_PROMISE, {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).toBeResolvedTo(ONE);
                expect(factory).toHaveBeenCalledTimes(2);
                await expectAsync(context.inject(BUILDING_PROMISE, {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).toBeResolvedTo(TWO);
                expect(factory).toHaveBeenCalledTimes(3);
                await expectAsync(context.inject(BUILDING_PROMISE, {
                    qualifier: '1-step',
                })).toBeResolvedTo(ZERO);
                expect(factory).toHaveBeenCalledTimes(3);

                factory = createSpy('stringFactorySpy').and.returnValues(Promise.resolve(ZERO),
                    Promise.resolve(null), Promise.resolve(undefined), Promise.resolve(TWO));
                context = new Context().provide(BUILDING_PROMISE, '1-step', factory);
                expect(factory).toHaveBeenCalledOnceWith(context);
                await expectAsync(context.inject(BUILDING_PROMISE, {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).toBeRejectedWithError(new RegExp(`^${Context.ERR_EMPTY_VALUE}`));
                expect(factory).toHaveBeenCalledTimes(2);
                await expectAsync(context.inject(BUILDING_PROMISE, {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).toBeRejectedWithError(new RegExp(`^${Context.ERR_EMPTY_VALUE}`));
                expect(factory).toHaveBeenCalledTimes(3);
                await expectAsync(context.inject(BUILDING_PROMISE, {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).toBeResolvedTo(TWO);
                expect(factory).toHaveBeenCalledTimes(4);
                await expectAsync(context.inject(BUILDING_PROMISE, {
                    qualifier: '1-step',
                })).toBeResolvedTo(ZERO);
                expect(factory).toHaveBeenCalledTimes(4);
            });
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
