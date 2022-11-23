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
            it('noop', () => {
            });
        });

        describe('(token: string, qualifier: string)', () => {
            it('noop', () => {
            });
        });

        describe('(token: string, injectOptions)', () => {
            it('noop', () => {
            });
        });

        describe('(token: Class)', () => {
            it('noop', () => {
            });
        });

        describe('(token: Class, qualifier: string)', () => {
            it('noop', () => {
            });
        });

        describe('(token: Class, injectOptions)', () => {
            it('noop', () => {
            });
        });

        describe('(token: Context.Token)', () => {
            it('noop', () => {
            });
        });

        describe('(token: Context.Token, qualifier: string)', () => {
            it('noop', () => {
            });
        });

        describe('(token: Context.Token, injectOptions)', () => {
            it('noop', () => {
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
