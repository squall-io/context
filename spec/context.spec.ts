import {beforeEach, describe, expect, it, jest} from '@jest/globals';
import {Context, Promise as ContextPromise} from '../src';
import Mock = jest.Mock;
import Token = Context.Token;

const {fn} = jest;

describe('Context', () => {
    describe('.hasOwn', () => {
        it('(token)', function () {
            expect(new Context()
                .hasOwn('address')).toBe(false);
            expect(new Context()
                .provide('address', ['here', 'around'], () => 'Earth')
                .hasOwn('address')).toBe(false);
            expect(new Context(
                new Context()
                    .provide('address', () => 'Earth'))
                .hasOwn('address')).toBe(false);
            expect(new Context(
                new Context()
                    .provide('address', 'here', () => 'Earth'))
                .hasOwn('address')).toBe(false);
            expect(new Context(
                new Context()
                    .provide('address', ['here', 'around'], () => 'Earth'))
                .hasOwn('address')).toBe(false);

            expect(new Context()
                .provide('address', () => 'Earth')
                .hasOwn('address')).toBe(true);
            expect(new Context()
                .provide('address', 'here', () => 'Earth')
                .hasOwn('address')).toBe(true);
        });

        it('(token, qualifier)', function () {
            expect(new Context()
                .hasOwn('address', 'here')).toBe(false);
            expect(new Context()
                .provide('address', () => 'Earth')
                .hasOwn('address', 'here')).toBe(false);
            expect(new Context(
                new Context())
                .hasOwn('address', 'here')).toBe(false);
            expect(new Context(
                new Context()
                    .provide('address', () => 'Earth'))
                .hasOwn('address', 'here')).toBe(false);
            expect(new Context(
                new Context()
                    .provide('address', 'here', () => 'Earth'))
                .hasOwn('address', 'here')).toBe(false);

            expect(new Context()
                .provide('address', 'here', () => 'Earth')
                .hasOwn('address', 'here')).toBe(true);
            expect(new Context()
                .provide('address', ['here', 'around'], () => 'Earth')
                .hasOwn('address', 'here')).toBe(true);
        });
    });

    describe('.has', () => {
        it('(token)', function () {
            expect(new Context()
                .has('HOST')).toBe(false);
            expect(new Context()
                .provide('HEIST', () => 'La Casa de Papel')
                .has('HOST')).toBe(false);
            expect(new Context(
                new Context()
                    .provide('HEIST', () => 'La Casa de Papel'))
                .has('HOST')).toBe(false);
            expect(new Context(
                new Context()
                    .provide('HEIST', () => 'La Casa de Papel'))
                .provide('HOST', ['okay', 'why-not'], () => 'La Casa de Papel')
                .has('HOST')).toBe(false);

            expect(new Context()
                .provide('HOST', () => 'localhost')
                .has('HOST')).toBe(true);
            expect(new Context()
                .provide('HOST', () => 'localhost')
                .provide('HEIST', () => 'La Casa de Papel')
                .has('HOST')).toBe(true);
            expect(new Context(
                new Context()
                    .provide('HOST', () => 'localhost'))
                .provide('HEIST', () => 'La Casa de Papel')
                .has('HOST')).toBe(true);
            expect(new Context()
                .provide('HOST', 'okay', () => 'La Casa de Papel')
                .has('HOST')).toBe(true);
            expect(new Context(
                new Context()
                    .provide('HOST', 'okay', () => 'localhost'))
                .provide('HEIST', () => 'La Casa de Papel')
                .has('HOST')).toBe(true);
        });

        it('(token, qualifier)', function () {
            expect(new Context()
                .has('HOST', 'okay')).toBe(false);
            expect(new Context()
                .provide('HOST', () => 'localhost')
                .has('HOST', 'okay')).toBe(false);
            expect(new Context()
                .provide('HEIST', () => 'La Casa de Papel')
                .has('HOST', 'okay')).toBe(false);
            expect(new Context(
                new Context()
                    .provide('HEIST', () => 'La Casa de Papel'))
                .has('HOST', 'okay')).toBe(false);
            expect(new Context(
                new Context()
                    .provide('HEIST', () => 'La Casa de Papel')
                    .provide('HOST', () => 'localhost'))
                .has('HOST', 'okay')).toBe(false);
            expect(new Context(
                new Context()
                    .provide('HEIST', () => 'La Casa de Papel'))
                .provide('HOST', ['good-enough', 'why-not'], () => 'La Casa de Papel')
                .has('HOST', 'okay')).toBe(false);

            expect(new Context()
                .provide('HOST', 'okay', () => 'localhost')
                .has('HOST', 'okay')).toBe(true);
            expect(new Context()
                .provide('HOST', 'okay', () => 'localhost')
                .provide('HEIST', () => 'La Casa de Papel')
                .has('HOST', 'okay')).toBe(true);
            expect(new Context(
                new Context()
                    .provide('HOST', 'okay', () => 'localhost'))
                .provide('HEIST', () => 'La Casa de Papel')
                .has('HOST')).toBe(true);
            expect(new Context(
                new Context()
                    .provide('HOST', 'okay', () => 'localhost'))
                .provide('HOST', () => 'localhost')
                .has('HOST', 'okay')).toBe(true);
            expect(new Context(
                new Context()
                    .provide('HOST', 'okay', () => 'localhost'),
                new Context()
                    .provide('HOST', 'why-not', () => 'localhost'))
                .provide('HEIST', () => 'La Casa de Papel')
                .has('HOST', 'okay')).toBe(true);
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
                    .hasOwn('target')).toBe(true);
            });

            it('register token at invoked context', () => {
                const parents = [new Context(), new Context()];
                const context = new Context(...parents);

                context.provide('target', () => '');

                expect(context.hasOwn('target')).toBe(true);
                expect(parents.every(parent => !parent.hasOwn('target'))).toBe(true);
            });

            it('invoke factory function', () => {
                const factory = fn(() => false);
                const context = new Context().provide('target', factory);

                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, 'target');
            });

            it('invoke factory function WHEN context configuration.factory.lazyFunctionEvaluation === false', () => {
                const factory = fn(() => false);
                const context = new Context({
                    factory: {
                        lazyFunctionEvaluation: false,
                    },
                }).provide('target', factory);

                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, 'target');
            });

            it('do not invoke factory function WHEN context configuration.factory.lazyFunctionEvaluation === true', () => {
                const factory = fn();
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
                expect(() => cached(new Context())
                    .provide('address', () => Promise.resolve(null))).not.toThrow();
                cached.silenced('address');
                expect(() => cached(new Context())
                    .provide('address', () => Promise.resolve(undefined))).not.toThrow();
                cached.silenced('address');
                expect(() => new Context()
                    .provide('address', () => null)).toThrowError(
                    (thrown: any) => thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
                expect(() => new Context()
                    .provide('address', () => undefined)).toThrowError(
                    (thrown: any) => thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
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
                expect(() => cached(new Context({
                    factory: {
                        lazyValidation: false,
                    },
                })).provide('address', () => Promise.resolve(null))).not.toThrow();
                cached.silenced('address');
                expect(() => cached(new Context({
                    factory: {
                        lazyValidation: false,
                    },
                })).provide('address', () => Promise.resolve(undefined))).not.toThrow();
                cached.silenced('address');
                expect(() => new Context({
                    factory: {
                        lazyValidation: false,
                    },
                }).provide('address', () => null)).toThrowError(
                    (thrown: any) => thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
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
                expect(() => cached(new Context({
                    factory: {
                        lazyValidation: true,
                    }
                })).provide('address', () => Promise.resolve(null))).not.toThrow();
                cached.silenced('address');
                expect(() => cached(new Context({
                    factory: {
                        lazyValidation: true,
                    }
                })).provide('address', () => Promise.resolve(undefined))).not.toThrow();
                cached.silenced('address');
            });

            it('prevent overriding token at the same context level', () => {
                expect(() => new Context()
                    .provide('address', () => 'Earth')
                    .provide('address', () => 'Earth')
                ).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_DUPLICATE_FACTORY === thrown.name);
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
                expect(context.hasOwn('target', 'primary')).toBe(true);
                expect(context.hasOwn('target', 'write-candidate')).toBe(true);
            });

            it('register token at invoked context', () => {
                const parents = [new Context(), new Context()];
                const context = new Context(...parents);

                context.provide('target', 'primary', () => '');

                expect(context.hasOwn('target', 'primary')).toBe(true);
                expect(parents.every(parent => !parent.hasOwn('target', 'primary'))).toBe(true);
            });

            it('invoke factory function', () => {
                const factory = fn(() => false);
                const context = new Context().provide('target', 'primary', factory);

                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, 'target', 'primary');
            });

            it('invoke factory function WHEN context configuration.factory.lazyFunctionEvaluation === false', () => {
                const factory = fn(() => false);
                const context = new Context({
                    factory: {
                        lazyFunctionEvaluation: false,
                    },
                }).provide('target', ['primary', 'write-candidate'], factory);

                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, 'target', 'primary', 'write-candidate');
            });

            it('validate factory-returned value', () => {
                expect(() => new Context()
                    .provide('address', 'primary', () => '')).not.toThrow();
                expect(() => new Context()
                    .provide('address', 'primary', () => Promise.resolve(''))).not.toThrow();
                expect(() => cached(new Context())
                    .provide('address', 'primary', () => Promise.resolve(null))).not.toThrow();
                cached.silenced('address', 'primary');
                expect(() => cached(new Context())
                    .provide('address', 'primary', () => Promise.resolve(undefined))).not.toThrow();
                cached.silenced('address', 'primary');
                expect(() => new Context()
                    .provide('address', 'primary', () => null)).toThrowError(
                    (thrown: any) => thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
                expect(() => new Context()
                    .provide('address', 'primary', () => undefined)).toThrowError(
                    (thrown: any) => thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
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
                expect(() => cached(new Context({
                    factory: {
                        lazyValidation: false,
                    },
                })).provide('address', 'primary', () => Promise.resolve(null))).not.toThrow();
                cached.silenced('address', 'primary');
                expect(() => cached(new Context({
                    factory: {
                        lazyValidation: false,
                    },
                })).provide('address', 'primary', () => Promise.resolve(undefined))).not.toThrow();
                cached.silenced('address', 'primary');
                expect(() => new Context({
                    factory: {
                        lazyValidation: false,
                    },
                }).provide('address', 'primary', () => null)).toThrowError(
                    (thrown: any) => thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
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
                expect(() => cached(new Context({
                    factory: {
                        lazyValidation: true,
                    }
                })).provide('address', 'primary', () => Promise.resolve(null))).not.toThrow();
                cached.silenced('address', 'primary');
                expect(() => cached(new Context({
                    factory: {
                        lazyValidation: true,
                    }
                })).provide('address', 'primary', () => Promise.resolve(undefined))).not.toThrow();
                cached.silenced('address', 'primary');
            });

            it('prevent overriding token at the same context level', () => {
                expect(() => new Context()
                    .provide('address', 'primary', () => 'Earth')
                    .provide('address', 'primary', () => 'Earth')
                ).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_DUPLICATE_FACTORY === thrown.name);
                expect(() => new Context()
                    .provide('address', ['primary', 'write-candidate'], () => 'Earth')
                    .provide('address', 'primary', () => 'Earth')
                ).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_DUPLICATE_FACTORY === thrown.name);
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
                    .hasOwn(Nothing)).toBe(true);
            });

            it('register token at invoked context', () => {
                const parents = [new Context(), new Context()];
                const context = new Context(...parents);

                context.provide(Nothing, () => new Nothing());

                expect(context.hasOwn(Nothing)).toBe(true);
                expect(parents.every(parent => !parent.hasOwn(Nothing))).toBe(true);
            });

            it('invoke factory function', () => {
                const factory = fn(() => new Nothing());
                const context = new Context().provide(Nothing, factory);

                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, Nothing);
            });

            it('invoke factory function WHEN context configuration.factory.lazyFunctionEvaluation === false', () => {
                const factory = fn(() => new Nothing());

                const context = new Context({
                    factory: {
                        lazyFunctionEvaluation: false,
                    },
                }).provide(Nothing, factory);

                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, Nothing);
            });

            it('do not invoke factory function WHEN context configuration.factory.lazyFunctionEvaluation === true', () => {
                const factory = fn<() => Nothing>();

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
                    .provide(Nothing, () => null as any as Nothing)).toThrowError(
                    (thrown: any) => thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
                expect(() => new Context()
                    .provide(Nothing, () => undefined as any as Nothing)).toThrowError(
                    (thrown: any) => thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
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
                }).provide(Nothing, () => null as any as Nothing)).toThrowError(
                    (thrown: any) => thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
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
                    .provide(Nothing, () => new Nothing())
                ).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_DUPLICATE_FACTORY === thrown.name);
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
                    .hasOwn(Nothing)).toBe(true);
            });

            it('register token at invoked context', () => {
                const parents = [new Context(), new Context()];
                const context = new Context(...parents);

                context.provide(Nothing, new Nothing());

                expect(context.hasOwn(Nothing)).toBe(true);
                expect(parents.every(parent => !parent.hasOwn(Nothing))).toBe(true);
            });

            it('invoke factory function WHEN context configuration.factory.lazyFunctionEvaluation === false', () => {
                const factory = fn(() => new Nothing());

                const context = new Context({
                    factory: {
                        lazyFunctionEvaluation: false,
                    },
                }).provide(Nothing, factory);

                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, Nothing);
            });

            it('do not invoke factory function WHEN context configuration.factory.lazyFunctionEvaluation === true', () => {
                const factory = fn<() => Nothing>();

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
                    .provide(Nothing, null as any as Nothing)).toThrowError(
                    (thrown: any) => thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
                expect(() => new Context()
                    .provide(Nothing, undefined as any as Nothing)).toThrowError(
                    (thrown: any) => thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
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
                }).provide(Nothing, null as any as Nothing)).toThrowError(
                    (thrown: any) => thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
                expect(() => new Context({
                    factory: {
                        lazyValidation: false,
                    },
                }).provide(Nothing, undefined as any as Nothing)).toThrowError(
                    (thrown: any) => thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
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
                    .provide(Nothing, new Nothing())
                ).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_DUPLICATE_FACTORY === thrown.name);
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
                    .hasOwn(NOTHING_TOKEN,)).toBe(true);
            });

            it('register token at invoked context', () => {
                const parents = [new Context(), new Context()];
                const context = new Context(...parents);

                context.provide(NOTHING_TOKEN, () => new Nothing());

                expect(context.hasOwn(NOTHING_TOKEN,)).toBe(true);
                expect(parents.every(parent => !parent.hasOwn(NOTHING_TOKEN,))).toBe(true);
            });

            it('invoke factory function', () => {
                const factory = fn(() => new Nothing());
                const context = new Context().provide(NOTHING_TOKEN, factory);

                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, NOTHING_TOKEN);
            });

            it('invoke factory function WHEN context configuration.factory.lazyFunctionEvaluation === false', () => {
                const factory = fn(() => new Nothing());

                const context = new Context({
                    factory: {
                        lazyFunctionEvaluation: false,
                    },
                }).provide(NOTHING_TOKEN, factory);

                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, NOTHING_TOKEN);
            });

            it('do not invoke factory function WHEN context configuration.factory.lazyFunctionEvaluation === true', () => {
                const factory = fn<() => Nothing>();

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
                    .provide(NOTHING_TOKEN, () => null as any as Nothing)).toThrowError(
                    (thrown: any) => thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
                expect(() => new Context()
                    .provide(NOTHING_TOKEN, () => undefined as any as Nothing)).toThrowError(
                    (thrown: any) => thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
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
                }).provide(NOTHING_TOKEN, () => null as any as Nothing)).toThrowError(
                    (thrown: any) => thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
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
                    .provide(NOTHING_TOKEN, () => new Nothing())
                ).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_DUPLICATE_FACTORY === thrown.name);
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
                    .hasOwn(NOTHING_TOKEN,)).toBe(true);
            });

            it('register token at invoked context', () => {
                const parents = [new Context(), new Context()];
                const context = new Context(...parents);

                context.provide(NOTHING_TOKEN, new Nothing());

                expect(context.hasOwn(NOTHING_TOKEN,)).toBe(true);
                expect(parents.every(parent => !parent.hasOwn(NOTHING_TOKEN,))).toBe(true);
            });

            it('invoke factory function WHEN context configuration.factory.lazyFunctionEvaluation === false', () => {
                const factory = fn(() => new Nothing());

                const context = new Context({
                    factory: {
                        lazyFunctionEvaluation: false,
                    },
                }).provide(NOTHING_TOKEN, factory);

                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, NOTHING_TOKEN);
            });

            it('do not invoke factory function WHEN context configuration.factory.lazyFunctionEvaluation === true', () => {
                const factory = fn<() => Nothing>();

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
                    .provide(NOTHING_TOKEN, null as any as Nothing)).toThrowError(
                    (thrown: any) => thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
                expect(() => new Context()
                    .provide(NOTHING_TOKEN, undefined as any as Nothing)).toThrowError(
                    (thrown: any) => thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
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
                }).provide(NOTHING_TOKEN, null as any as Nothing)).toThrowError(
                    (thrown: any) => thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
                expect(() => new Context({
                    factory: {
                        lazyValidation: false,
                    },
                }).provide(NOTHING_TOKEN, undefined as any as Nothing)).toThrowError(
                    (thrown: any) => thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
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
                    .provide(NOTHING_TOKEN, new Nothing())
                ).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_DUPLICATE_FACTORY === thrown.name);
            });
        });
    });

    describe('.inject', () => {
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
                const factory = fn();
                factory.mockReturnValueOnce(expected);
                factory.mockReturnValueOnce(Math.random().toString(36));
                const context = new Context().provide('address', factory);

                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, 'address');
                expect(context.inject('address')).toBe(expected);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, 'address');
                expect(context.inject('address')).toBe(expected);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, 'address');

                const otherExpected = Math.random().toString(36);
                const otherFactory = fn();
                otherFactory.mockReturnValueOnce(otherExpected);
                otherFactory.mockReturnValueOnce(Math.random().toString(36));
                const otherContext = new Context().provide('address', otherFactory);

                expect(otherFactory).toHaveBeenCalledTimes(1);
                expect(otherFactory).nthCalledWith(1, otherContext, 'address');
                expect(otherContext.inject('address')).toBe(otherExpected);
                expect(otherFactory).toHaveBeenCalledTimes(1);
                expect(otherFactory).nthCalledWith(1, otherContext, 'address');
                expect(otherContext.inject('address')).toBe(otherExpected);
                expect(otherFactory).toHaveBeenCalledTimes(1);
                expect(otherFactory).nthCalledWith(1, otherContext, 'address');

                const anotherExpected = Math.random().toString(36);
                const anotherFactory = fn();
                anotherFactory.mockReturnValueOnce(anotherExpected);
                anotherFactory.mockReturnValueOnce(Math.random().toString(36));
                const anotherContext = new Context({
                    factory: {
                        lazyFunctionEvaluation: true,
                    }
                }).provide('address', anotherFactory);

                expect(anotherFactory).not.toHaveBeenCalled();
                expect(anotherContext
                    .inject('address')).toBe(anotherExpected);
                expect(anotherFactory).toHaveBeenCalledTimes(1);
                expect(anotherFactory).nthCalledWith(1, anotherContext, 'address');
                expect(anotherContext.inject('address')).toBe(anotherExpected);
                expect(anotherFactory).toHaveBeenCalledTimes(1);
                expect(anotherFactory).nthCalledWith(1, anotherContext, 'address');
            });

            it('evaluate factory with invocation context', () => {
                const expected = Math.random().toString(36);
                const factory = fn(() => expected)
                const context = new Context(new Context()
                    .provide('address', factory));

                context.inject('address');
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, 'address');
            });

            it('caches factory-evaluated value at bean definition context', () => {
                const expected = Math.random().toString(36);
                const factory = fn(() => expected);
                const parent = new Context().provide('address', factory);
                const context = new Context(parent);

                expect(context.inject('address')).toBe(expected);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, 'address');
                expect(parent.inject('address')).toBe(expected);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, 'address');
            });

            it('fail WHEN factory-evaluated value is empty', () => {
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                })
                    .provide('address', () => null)
                    .inject('address')).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
                expect(() => new Context({
                    factory: {
                        lazyFunctionEvaluation: true,
                    }
                })
                    .provide('address', () => null)
                    .inject('address')).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                })
                    .provide('address', () => undefined)
                    .inject('address')).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
                expect(() => new Context({
                    factory: {
                        lazyFunctionEvaluation: true,
                    }
                })
                    .provide('address', () => undefined)
                    .inject('address')).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
            });

            it('fail WHEN factory-evaluated promise value is empty', async () => {
                await expect(new Context()
                    .provide('address', () => Promise.resolve(null))
                    .inject('address')
                ).rejects.toHaveProperty('name', Context.ERR_EMPTY_VALUE);
                await expect(new Context()
                    .provide('address', () => Promise.resolve(undefined))
                    .inject('address')
                ).rejects.toHaveProperty('name', Context.ERR_EMPTY_VALUE);

                const expected = Math.random().toString(36);
                await expect(new Context()
                    .provide('address', () => Promise.resolve(expected))
                    .inject('address')
                ).resolves.toBe(expected);
            });

            it('fail WHEN there is undecidable bean at any level of contexts', () => {
                const expected = Math.random().toString(36);
                expect(() => new Context(
                    new Context()
                        .provide('address', () => expected))
                    .provide('address', 'home', () => Math.random().toString(36))
                    .provide('address', 'work', () => Math.random().toString(36))
                    .inject('address')
                ).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_UNDECIDABLE_BEAN === thrown.name);
            });

            it('fail WHEN no bean definition the tree has been provided', () => {
                expect(() => new Context().inject('home')).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_NO_BEAN_DEFINITION === thrown.name);
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
                const factory = fn();
                factory.mockReturnValueOnce(expected);
                factory.mockReturnValueOnce(Math.random().toString(36));
                const context = new Context().provide('address', 'home', factory);

                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, 'address', 'home');
                expect(context.inject('address', 'home')).toBe(expected);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, 'address', 'home');
                expect(context.inject('address', 'home')).toBe(expected);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, 'address', 'home');

                const otherExpected = Math.random().toString(36);
                const otherFactory = fn();
                otherFactory.mockReturnValueOnce(otherExpected);
                otherFactory.mockReturnValueOnce(Math.random().toString(36));
                const otherContext = new Context().provide('address', 'home', otherFactory);

                expect(otherFactory).toHaveBeenCalledTimes(1);
                expect(otherFactory).nthCalledWith(1, otherContext, 'address', 'home');
                expect(otherContext.inject('address', 'home')).toBe(otherExpected);
                expect(otherFactory).toHaveBeenCalledTimes(1);
                expect(otherFactory).nthCalledWith(1, otherContext, 'address', 'home');
                expect(otherContext.inject('address', 'home')).toBe(otherExpected);
                expect(otherFactory).toHaveBeenCalledTimes(1);
                expect(otherFactory).nthCalledWith(1, otherContext, 'address', 'home');

                const anotherExpected = Math.random().toString(36);
                const anotherFactory = fn();
                anotherFactory.mockReturnValueOnce(anotherExpected);
                anotherFactory.mockReturnValueOnce(Math.random().toString(36));
                const anotherContext = new Context({
                    factory: {
                        lazyFunctionEvaluation: true,
                    }
                }).provide('address', 'home', anotherFactory);

                expect(anotherFactory).not.toHaveBeenCalled();
                expect(anotherContext
                    .inject('address', 'home')).toBe(anotherExpected);
                expect(anotherFactory).toHaveBeenCalledTimes(1);
                expect(anotherFactory).nthCalledWith(1, anotherContext, 'address', 'home');
                expect(anotherContext.inject('address', 'home')).toBe(anotherExpected);
                expect(anotherFactory).toHaveBeenCalledTimes(1);
                expect(anotherFactory).nthCalledWith(1, anotherContext, 'address', 'home');
            });

            it('evaluate factory with invocation context', () => {
                const expected = Math.random().toString(36);
                const factory = fn(() => expected);
                const context = new Context(new Context()
                    .provide('address', 'home', factory));

                context.inject('address', 'home');
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, 'address', 'home');
            });

            it('caches factory-evaluated value at bean definition context', () => {
                const expected = Math.random().toString(36);
                const factory = fn(() => expected);
                const parent = new Context().provide('address', 'home', factory);
                const context = new Context(parent);

                expect(context.inject('address', 'home')).toBe(expected);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, 'address', 'home');
                expect(parent.inject('address', 'home')).toBe(expected);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, 'address', 'home');
            });

            it('fail WHEN factory-evaluated value is empty', () => {
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                })
                    .provide('address', 'home', () => null)
                    .inject('address', 'home')).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
                expect(() => new Context({
                    factory: {
                        lazyFunctionEvaluation: true,
                    }
                })
                    .provide('address', 'home', () => null)
                    .inject('address', 'home')).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                })
                    .provide('address', 'home', () => undefined)
                    .inject('address', 'home')).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
                expect(() => new Context({
                    factory: {
                        lazyFunctionEvaluation: true,
                    }
                })
                    .provide('address', 'home', () => undefined)
                    .inject('address', 'home')).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
            });

            it('fail WHEN factory-evaluated promise value is empty', async () => {
                await expect(new Context()
                    .provide('address', 'home', () => Promise.resolve(null))
                    .inject('address', 'home')
                ).rejects.toHaveProperty('name', Context.ERR_EMPTY_VALUE);
                await expect(new Context()
                    .provide('address', 'home', () => Promise.resolve(undefined))
                    .inject('address', 'home')
                ).rejects.toHaveProperty('name', Context.ERR_EMPTY_VALUE);

                const expected = Math.random().toString(36);
                await expect(new Context()
                    .provide('address', 'home', () => Promise.resolve(expected))
                    .inject('address', 'home')
                ).resolves.toBe(expected);
            });

            it('fail WHEN no bean definition the tree has been provided', () => {
                expect(() => new Context().inject('address', 'home')).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_NO_BEAN_DEFINITION === thrown.name);
            });
        });

        describe('(token: string, injectOptions)', () => {
            it('resolve bean', async () => {
                const expected = Math.random().toString(36);
                expect(new Context()
                    .provide('address', () => expected)
                    .inject('address', {})
                ).toBe(expected);
                await expect(new Context()
                    .provide('address', () => Promise.resolve(expected))
                    .inject('address', {})
                ).resolves.toBe(expected);

                expect(new Context()
                    .provide('address', 'work', () => expected)
                    .inject('address', {qualifier: 'work'})
                ).toBe(expected);
                await expect(new Context()
                    .provide('address', 'work', () => Promise.resolve(expected))
                    .inject('address', {qualifier: 'work'})
                ).resolves.toBe(expected);

                let context = new Context();
                let factory: Mock<() => any> = fn(() => expected);
                expect(context
                    .provide('address', 'work', factory)
                    .inject('address', {qualifier: 'work', forceEvaluation: false})
                ).toBe(expected);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, 'address', 'work');
                context = new Context();
                factory = fn(() => Promise.resolve(expected));
                await expect(new Context()
                    .provide('address', 'work', factory)
                    .inject('address', {qualifier: 'work', forceEvaluation: false})
                ).resolves.toBe(expected);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, 'address', 'work');
            });

            it('fail WHEN value is empty', async () => {
                expect(() => new Context({factory: {lazyFunctionEvaluation: true}})
                    .provide('address', () => null)
                    .inject('address', {})).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
                expect(() => new Context({factory: {lazyFunctionEvaluation: true}})
                    .provide('address', () => undefined)
                    .inject('address', {})).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);

                expect(() => new Context({factory: {lazyFunctionEvaluation: true}})
                    .provide('address', 'home', () => null)
                    .inject('address', {qualifier: 'home'})).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
                expect(() => new Context({factory: {lazyFunctionEvaluation: true}})
                    .provide('address', 'home', () => undefined)
                    .inject('address', {qualifier: 'home'})).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);

                await expect(new Context({factory: {lazyFunctionEvaluation: true}})
                    .provide('address', () => Promise.resolve(null))
                    .inject('address', {})
                ).rejects.toHaveProperty('name', Context.ERR_EMPTY_VALUE);
                await expect(new Context({factory: {lazyFunctionEvaluation: true}})
                    .provide('address', () => Promise.resolve(undefined))
                    .inject('address', {})
                ).rejects.toHaveProperty('name', Context.ERR_EMPTY_VALUE);

                let context = new Context();
                let factory: Mock<() => any> = fn(() => Promise.resolve(null));
                await expect(context
                    .provide('address', 'work', factory)
                    .inject('address', {qualifier: 'work', forceEvaluation: false})
                ).rejects.toHaveProperty('name', Context.ERR_EMPTY_VALUE);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, 'address', 'work');
                context = new Context();
                factory = fn(() => Promise.resolve(undefined));
                await expect(new Context()
                    .provide('address', 'work', factory)
                    .inject('address', {qualifier: 'work', forceEvaluation: false})
                ).rejects.toHaveProperty('name', Context.ERR_EMPTY_VALUE);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, 'address', 'work');
            });

            it('revaluate factory and validate value WHEN injectOptions.forceEvaluation === true, without caching the result', async () => {
                let factory: Mock<() => any> = fn();
                factory.mockReturnValueOnce(0);
                factory.mockReturnValueOnce(1);
                factory.mockReturnValueOnce(2);
                let context = new Context().provide('counter', factory);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, 'counter');
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

                factory = fn();
                factory.mockReturnValueOnce(0);
                factory.mockReturnValueOnce(null);
                factory.mockReturnValueOnce(undefined);
                factory.mockReturnValueOnce(2);
                context = new Context().provide('counter', factory);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, 'counter');
                expect(() => context.inject('counter', {
                    forceEvaluation: true,
                })).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
                expect(factory).toHaveBeenCalledTimes(2);
                expect(() => context.inject('counter', {
                    forceEvaluation: true,
                })).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
                expect(factory).toHaveBeenCalledTimes(3);
                expect(context.inject('counter', {
                    forceEvaluation: true,
                })).toBe(2);
                expect(factory).toHaveBeenCalledTimes(4);
                expect(context.inject('counter', {})).toBe(0);
                expect(factory).toHaveBeenCalledTimes(4);

                factory = fn();
                factory.mockReturnValueOnce(Promise.resolve(0));
                factory.mockReturnValueOnce(Promise.resolve(1));
                factory.mockReturnValueOnce(Promise.resolve(2));
                context = new Context().provide('counter', factory);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, 'counter');
                await expect(context.inject('counter', {
                    forceEvaluation: true,
                })).resolves.toBe(1);
                expect(factory).toHaveBeenCalledTimes(2);
                await expect(context.inject('counter', {
                    forceEvaluation: true,
                })).resolves.toBe(2);
                expect(factory).toHaveBeenCalledTimes(3);
                await expect(context.inject('counter', {})).resolves.toBe(0);
                expect(factory).toHaveBeenCalledTimes(3);

                factory = fn();
                factory.mockReturnValueOnce(Promise.resolve(0));
                factory.mockReturnValueOnce(Promise.resolve(null));
                factory.mockReturnValueOnce(Promise.resolve(undefined));
                factory.mockReturnValueOnce(Promise.resolve(2));
                context = new Context().provide('counter', factory);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, 'counter');
                await expect(context.inject('counter', {
                    forceEvaluation: true,
                })).rejects.toHaveProperty('name', Context.ERR_EMPTY_VALUE);
                expect(factory).toHaveBeenCalledTimes(2);
                await expect(context.inject('counter', {
                    forceEvaluation: true,
                })).rejects.toHaveProperty('name', Context.ERR_EMPTY_VALUE);
                expect(factory).toHaveBeenCalledTimes(3);
                await expect(context.inject('counter', {
                    forceEvaluation: true,
                })).resolves.toBe(2);
                expect(factory).toHaveBeenCalledTimes(4);
                await expect(context.inject('counter', {})).resolves.toBe(0);
                expect(factory).toHaveBeenCalledTimes(4);

                factory = fn();
                factory.mockReturnValueOnce(0);
                factory.mockReturnValueOnce(1);
                factory.mockReturnValueOnce(2);
                context = new Context().provide('counter', '1-step', factory);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, 'counter', '1-step');
                expect(context.inject('counter', {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).toBe(1);
                expect(factory).toHaveBeenCalledTimes(2);
                expect(context.inject('counter', {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).toBe(2);
                expect(factory).toHaveBeenCalledTimes(3);
                expect(context.inject('counter', {
                    qualifier: '1-step',
                })).toBe(0);
                expect(factory).toHaveBeenCalledTimes(3);

                factory = fn();
                factory.mockReturnValueOnce(0);
                factory.mockReturnValueOnce(null);
                factory.mockReturnValueOnce(undefined);
                factory.mockReturnValueOnce(2);
                context = new Context().provide('counter', '1-step', factory);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, 'counter', '1-step');
                expect(() => context.inject('counter', {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
                expect(factory).toHaveBeenCalledTimes(2);
                expect(() => context.inject('counter', {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
                expect(factory).toHaveBeenCalledTimes(3);
                expect(context.inject('counter', {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).toBe(2);
                expect(factory).toHaveBeenCalledTimes(4);
                expect(context.inject('counter', {
                    qualifier: '1-step',
                })).toBe(0);
                expect(factory).toHaveBeenCalledTimes(4);

                factory = fn();
                factory.mockReturnValueOnce(Promise.resolve(0));
                factory.mockReturnValueOnce(Promise.resolve(1));
                factory.mockReturnValueOnce(Promise.resolve(2));
                context = new Context().provide('counter', '1-step', factory);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, 'counter', '1-step');
                await expect(context.inject('counter', {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).resolves.toBe(1);
                expect(factory).toHaveBeenCalledTimes(2);
                await expect(context.inject('counter', {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).resolves.toBe(2);
                expect(factory).toHaveBeenCalledTimes(3);
                await expect(context.inject('counter', {
                    qualifier: '1-step',
                })).resolves.toBe(0);
                expect(factory).toHaveBeenCalledTimes(3);

                factory = fn();
                factory.mockReturnValueOnce(Promise.resolve(0));
                factory.mockReturnValueOnce(Promise.resolve(null));
                factory.mockReturnValueOnce(Promise.resolve(undefined));
                factory.mockReturnValueOnce(Promise.resolve(2));
                context = cached(new Context()).provide('counter', '1-step', factory);
                cached.silenced('counter', '1-step');
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, 'counter', '1-step');
                await expect(context.inject('counter', {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).rejects.toHaveProperty('name', Context.ERR_EMPTY_VALUE);
                expect(factory).toHaveBeenCalledTimes(2);
                await expect(context.inject('counter', {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).rejects.toHaveProperty('name', Context.ERR_EMPTY_VALUE);
                expect(factory).toHaveBeenCalledTimes(3);
                await expect(context.inject('counter', {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).resolves.toBe(2);
                expect(factory).toHaveBeenCalledTimes(4);
                await expect(context.inject('counter', {
                    qualifier: '1-step',
                })).resolves.toBe(0);
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
                const factory = fn<() => Nothing>();
                factory.mockReturnValueOnce(expected);
                factory.mockReturnValueOnce(new Nothing());
                const context = new Context().provide(Nothing, factory);

                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, Nothing);
                expect(context.inject(Nothing)).toBe(expected);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, Nothing);
                expect(context.inject(Nothing)).toBe(expected);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, Nothing);

                const otherExpected = new Nothing();
                const otherFactory = fn<() => Nothing>();
                otherFactory.mockReturnValueOnce(otherExpected);
                otherFactory.mockReturnValueOnce(new Nothing());
                const otherContext = new Context().provide(Nothing, otherFactory);

                expect(otherFactory).toHaveBeenCalledTimes(1);
                expect(otherFactory).nthCalledWith(1, otherContext, Nothing);
                expect(otherContext.inject(Nothing)).toBe(otherExpected);
                expect(otherFactory).toHaveBeenCalledTimes(1);
                expect(otherFactory).nthCalledWith(1, otherContext, Nothing);
                expect(otherContext.inject(Nothing)).toBe(otherExpected);
                expect(otherFactory).toHaveBeenCalledTimes(1);
                expect(otherFactory).nthCalledWith(1, otherContext, Nothing);

                const anotherExpected = new Nothing();
                const anotherFactory = fn<() => Nothing>();
                anotherFactory.mockReturnValueOnce(anotherExpected);
                anotherFactory.mockReturnValueOnce(new Nothing());
                const anotherContext = new Context({
                    factory: {
                        lazyFunctionEvaluation: true,
                    }
                }).provide(Nothing, anotherFactory);

                expect(anotherFactory).not.toHaveBeenCalled();
                expect(anotherContext
                    .inject(Nothing)).toBe(anotherExpected);
                expect(anotherFactory).toHaveBeenCalledTimes(1);
                expect(anotherFactory).nthCalledWith(1, anotherContext, Nothing);
                expect(anotherContext.inject(Nothing)).toBe(anotherExpected);
                expect(anotherFactory).toHaveBeenCalledTimes(1);
                expect(anotherFactory).nthCalledWith(1, anotherContext, Nothing);
            });

            it('evaluate factory with invocation context', () => {
                const expected = new Nothing();
                const factory = fn(() => expected);
                const context = new Context(new Context()
                    .provide(Nothing, factory));

                context.inject(Nothing);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, Nothing);
            });

            it('caches factory-evaluated value at bean definition context', () => {
                const expected = new Nothing();
                const factory = fn(() => expected);
                const parent = new Context().provide(Nothing, factory);
                const context = new Context(parent);

                expect(context.inject(Nothing)).toBe(expected);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, Nothing);
                expect(parent.inject(Nothing)).toBe(expected);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, Nothing);
            });

            it('fail WHEN factory-evaluated value is empty', () => {
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                })
                    .provide(Nothing, () => null as any as Nothing)
                    .inject(Nothing)).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
                expect(() => new Context({
                    factory: {
                        lazyFunctionEvaluation: true,
                    }
                })
                    .provide(Nothing, () => null as any as Nothing)
                    .inject(Nothing)).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                })
                    .provide(Nothing, () => undefined as any as Nothing)
                    .inject(Nothing)).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
                expect(() => new Context({
                    factory: {
                        lazyFunctionEvaluation: true,
                    }
                })
                    .provide(Nothing, () => undefined as any as Nothing)
                    .inject(Nothing)).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
            });

            it('fail WHEN there is undecidable bean at any level of contexts', () => {
                const expected = new Nothing();
                expect(() => new Context(
                    new Context()
                        .provide(Nothing, () => expected))
                    .provide(Nothing, 'home', () => new Nothing())
                    .provide(Nothing, 'work', () => new Nothing())
                    .inject(Nothing)
                ).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_UNDECIDABLE_BEAN === thrown.name);
            });

            it('fail WHEN no bean definition the tree has been provided', () => {
                expect(() => new Context().inject('home')).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_NO_BEAN_DEFINITION === thrown.name);
            });
        });

        describe('(token: Class, qualifier: string)', () => {
            class Building {
                constructor(public number: number) {
                }
            }

            it('return provided value', () => {
                const expected = new Building(0);
                expect(new Context()
                    .provide(Building, () => expected)
                    .inject(Building)
                ).toBe(expected);
            });

            it('return default qualified value', () => {
                const expected = new Building(1);
                expect(new Context()
                    .provide(Building, () => expected)
                    .provide(Building, 'home', () => new Building(2))
                    .inject(Building)
                ).toBe(expected);
                expect(new Context()
                    .provide(Building, 'home', () => expected)
                    .inject(Building)
                ).toBe(expected);
            });

            it('return default qualified value from ancestor WHEN not possible at descendant level', () => {
                const expected = new Building(3);
                expect(new Context(
                    new Context()
                        .provide(Building, 'home', () => expected))
                    .inject(Building, 'home')
                ).toBe(expected);
            });

            it('return cached factory-evaluated value', () => {
                const expected = new Building(4);
                const factory = fn<() => Building>();
                factory.mockReturnValueOnce(expected);
                factory.mockReturnValueOnce(new Building(5));
                const context = new Context().provide(Building, 'home', factory);

                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, Building, 'home');
                expect(context.inject(Building, 'home')).toBe(expected);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, Building, 'home');
                expect(context.inject(Building, 'home')).toBe(expected);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, Building, 'home');

                const otherExpected = new Building(6);
                const otherFactory = fn<() => Building>();
                otherFactory.mockReturnValueOnce(otherExpected);
                otherFactory.mockReturnValueOnce(new Building(7));
                const otherContext = new Context().provide(Building, 'home', otherFactory);

                expect(otherFactory).toHaveBeenCalledTimes(1);
                expect(otherFactory).nthCalledWith(1, otherContext, Building, 'home');
                expect(otherContext.inject(Building, 'home')).toBe(otherExpected);
                expect(otherFactory).toHaveBeenCalledTimes(1);
                expect(otherFactory).nthCalledWith(1, otherContext, Building, 'home');
                expect(otherContext.inject(Building, 'home')).toBe(otherExpected);
                expect(otherFactory).toHaveBeenCalledTimes(1);
                expect(otherFactory).nthCalledWith(1, otherContext, Building, 'home');

                const anotherExpected = new Building(8);
                const anotherFactory = fn<() => Building>();
                anotherFactory.mockReturnValueOnce(anotherExpected);
                anotherFactory.mockReturnValueOnce(new Building(9));
                const anotherContext = new Context({
                    factory: {
                        lazyFunctionEvaluation: true,
                    }
                }).provide(Building, 'home', anotherFactory);

                expect(anotherFactory).not.toHaveBeenCalled();
                expect(anotherContext.inject(Building, 'home')).toBe(anotherExpected);
                expect(anotherFactory).toHaveBeenCalledTimes(1);
                expect(anotherFactory).nthCalledWith(1, anotherContext, Building, 'home');
                expect(anotherContext.inject(Building, 'home')).toBe(anotherExpected);
                expect(anotherFactory).toHaveBeenCalledTimes(1);
                expect(anotherFactory).nthCalledWith(1, anotherContext, Building, 'home');
            });

            it('evaluate factory with invocation context', () => {
                const expected = new Building(10);
                const factory = fn(() => expected);
                const context = new Context(new Context()
                    .provide(Building, 'home', factory));

                context.inject(Building, 'home');
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, Building, 'home');
            });

            it('caches factory-evaluated value at bean definition context', () => {
                const expected = new Building(11);
                const factory = fn(() => expected);
                const parent = new Context().provide(Building, 'home', factory);
                const context = new Context(parent);

                expect(context.inject(Building, 'home')).toBe(expected);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, Building, 'home');
                expect(parent.inject(Building, 'home')).toBe(expected);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, Building, 'home');
            });

            it('fail WHEN factory-evaluated value is empty', () => {
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                })
                    .provide(Building, 'home', () => null as any as Building)
                    .inject(Building, 'home')).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
                expect(() => new Context({
                    factory: {
                        lazyFunctionEvaluation: true,
                    }
                })
                    .provide(Building, 'home', () => null as any as Building)
                    .inject(Building, 'home')).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                })
                    .provide(Building, 'home', () => undefined as any as Building)
                    .inject(Building, 'home')).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
                expect(() => new Context({
                    factory: {
                        lazyFunctionEvaluation: true,
                    }
                })
                    .provide(Building, 'home', () => undefined as any as Building)
                    .inject(Building, 'home')).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
            });

            it('fail WHEN no bean definition the tree has been provided', () => {
                expect(() => new Context().inject(Building, 'home')).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_NO_BEAN_DEFINITION === thrown.name);
            });
        });

        describe('(token: Class, injectOptions)', () => {
            class Building {
                constructor(public number: number) {
                }
            }

            it('resolve bean', async () => {
                const expected = new Building(0);
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
                let factory = fn(() => expected);
                expect(context
                    .provide(Building, 'work', factory)
                    .inject(Building, {qualifier: 'work', forceEvaluation: false})
                ).toBe(expected);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, Building, 'work');
                context = new Context();
                factory = fn(() => expected);
                await expect(new Context()
                    .provide(Building, 'work', factory)
                    .inject(Building, {qualifier: 'work', forceEvaluation: false})
                ).toBe(expected);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, Building, 'work');
            });

            it('fail WHEN value is empty', async () => {
                expect(() => new Context({factory: {lazyValidation: true}})
                    .provide(Building, null as any as Building)
                    .inject(Building, {})).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_NO_BEAN_DEFINITION === thrown.name);
                expect(() => new Context({factory: {lazyValidation: true}})
                    .provide(Building, undefined as any as Building)
                    .inject(Building, {})).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_NO_BEAN_DEFINITION === thrown.name);

                expect(() => new Context({factory: {lazyFunctionEvaluation: true}})
                    .provide(Building, 'home', () => null as any as Building)
                    .inject(Building, {qualifier: 'home'})).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
                expect(() => new Context({factory: {lazyFunctionEvaluation: true}})
                    .provide(Building, 'home', () => undefined as any as Building)
                    .inject(Building, {qualifier: 'home'})).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);

                let context = new Context();
                let factory: Mock<() => any> = fn(() => Promise.resolve(null));
                await expect(context
                    .provide(Building, 'work', factory)
                    .inject(Building, {qualifier: 'work', forceEvaluation: false})
                ).rejects.toHaveProperty('name', Context.ERR_EMPTY_VALUE);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, Building, 'work');
                context = new Context();
                factory = fn(() => Promise.resolve(undefined));
                await expect(new Context()
                    .provide(Building, 'work', factory)
                    .inject(Building, {qualifier: 'work', forceEvaluation: false})
                ).rejects.toHaveProperty('name', Context.ERR_EMPTY_VALUE);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, Building, 'work');
            });

            it('revaluate factory and validate value WHEN injectOptions.forceEvaluation === true, without caching the result', async () => {
                const [ZERO, ONE, TWO] = [new Building(1), new Building(2), new Building(3)];
                let factory = fn<() => any>();
                factory.mockReturnValueOnce(ZERO);
                factory.mockReturnValueOnce(ONE);
                factory.mockReturnValueOnce(TWO);
                let context = new Context().provide(Building, factory);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, Building);
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

                factory = fn<() => number>();
                factory.mockReturnValueOnce(ZERO);
                factory.mockReturnValueOnce(null);
                factory.mockReturnValueOnce(undefined);
                factory.mockReturnValueOnce(TWO);
                context = new Context().provide(Building, factory);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, Building);
                expect(() => context.inject(Building, {
                    forceEvaluation: true,
                })).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
                expect(factory).toHaveBeenCalledTimes(2);
                expect(() => context.inject(Building, {
                    forceEvaluation: true,
                })).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
                expect(factory).toHaveBeenCalledTimes(3);
                expect(context.inject(Building, {
                    forceEvaluation: true,
                })).toBe(TWO);
                expect(factory).toHaveBeenCalledTimes(4);
                expect(context.inject(Building, {})).toBe(ZERO);
                expect(factory).toHaveBeenCalledTimes(4);

                factory = fn<() => Promise<number>>();
                factory.mockReturnValueOnce(Promise.resolve(ZERO));
                factory.mockReturnValueOnce(Promise.resolve(ONE));
                factory.mockReturnValueOnce(Promise.resolve(TWO));
                context = new Context().provide(Building, factory);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, Building);
                await expect(context.inject(Building, {
                    forceEvaluation: true,
                })).resolves.toBe(ONE);
                expect(factory).toHaveBeenCalledTimes(2);
                await expect(context.inject(Building, {
                    forceEvaluation: true,
                })).resolves.toBe(TWO);
                expect(factory).toHaveBeenCalledTimes(3);
                await expect(context.inject(Building, {})).resolves.toBe(ZERO);
                expect(factory).toHaveBeenCalledTimes(3);

                factory = fn<() => Promise<number>>();
                factory.mockReturnValueOnce(Promise.resolve(ZERO));
                factory.mockReturnValueOnce(Promise.resolve(null));
                factory.mockReturnValueOnce(Promise.resolve(undefined));
                factory.mockReturnValueOnce(Promise.resolve(TWO));
                context = cached(new Context()).provide(Building, factory);
                cached.silenced(Building);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, Building);
                await expect(context.inject(Building, {
                    forceEvaluation: true,
                })).rejects.toHaveProperty('name', Context.ERR_EMPTY_VALUE);
                expect(factory).toHaveBeenCalledTimes(2);
                await expect(context.inject(Building, {
                    forceEvaluation: true,
                })).rejects.toHaveProperty('name', Context.ERR_EMPTY_VALUE);
                expect(factory).toHaveBeenCalledTimes(3);
                await expect(context.inject(Building, {
                    forceEvaluation: true,
                })).resolves.toBe(TWO);
                expect(factory).toHaveBeenCalledTimes(4);
                await expect(context.inject(Building, {})).resolves.toBe(ZERO);
                expect(factory).toHaveBeenCalledTimes(4);

                factory = fn<() => number>();
                factory.mockReturnValueOnce(ZERO);
                factory.mockReturnValueOnce(ONE);
                factory.mockReturnValueOnce(TWO);
                context = new Context().provide(Building, '1-step', factory);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, Building, '1-step');
                expect(context.inject(Building, {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).toBe(ONE);
                expect(factory).toHaveBeenCalledTimes(2);
                expect(context.inject(Building, {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).toBe(TWO);
                expect(factory).toHaveBeenCalledTimes(3);
                expect(context.inject(Building, {
                    qualifier: '1-step',
                })).toBe(ZERO);
                expect(factory).toHaveBeenCalledTimes(3);

                factory = fn<() => number>();
                factory.mockReturnValueOnce(ZERO);
                factory.mockReturnValueOnce(null);
                factory.mockReturnValueOnce(undefined);
                factory.mockReturnValueOnce(TWO);
                context = new Context().provide(Building, '1-step', factory);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, Building, '1-step');
                expect(() => context.inject(Building, {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
                expect(factory).toHaveBeenCalledTimes(2);
                expect(() => context.inject(Building, {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
                expect(factory).toHaveBeenCalledTimes(3);
                expect(context.inject(Building, {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).toBe(TWO);
                expect(factory).toHaveBeenCalledTimes(4);
                expect(context.inject(Building, {
                    qualifier: '1-step',
                })).toBe(ZERO);
                expect(factory).toHaveBeenCalledTimes(4);

                factory = fn<() => Promise<number>>();
                factory.mockReturnValueOnce(Promise.resolve(ZERO));
                factory.mockReturnValueOnce(Promise.resolve(ONE));
                factory.mockReturnValueOnce(Promise.resolve(TWO));
                context = new Context().provide(Building, '1-step', factory);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, Building, '1-step');
                await expect(context.inject(Building, {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).resolves.toBe(ONE);
                expect(factory).toHaveBeenCalledTimes(2);
                await expect(context.inject(Building, {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).resolves.toBe(TWO);
                expect(factory).toHaveBeenCalledTimes(3);
                await expect(context.inject(Building, {
                    qualifier: '1-step',
                })).resolves.toBe(ZERO);
                expect(factory).toHaveBeenCalledTimes(3);

                factory = fn<() => Promise<number>>();
                factory.mockReturnValueOnce(Promise.resolve(ZERO));
                factory.mockReturnValueOnce(Promise.resolve(null));
                factory.mockReturnValueOnce(Promise.resolve(undefined));
                factory.mockReturnValueOnce(Promise.resolve(TWO));
                context = cached(new Context()).provide(Building, '1-step', factory);
                cached.silenced(Building, '1-step');
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, Building, '1-step');
                await expect(context.inject(Building, {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).rejects.toHaveProperty('name', Context.ERR_EMPTY_VALUE);
                expect(factory).toHaveBeenCalledTimes(2);
                await expect(context.inject(Building, {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).rejects.toHaveProperty('name', Context.ERR_EMPTY_VALUE);
                expect(factory).toHaveBeenCalledTimes(3);
                await expect(context.inject(Building, {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).resolves.toBe(TWO);
                expect(factory).toHaveBeenCalledTimes(4);
                await expect(context.inject(Building, {
                    qualifier: '1-step',
                })).resolves.toBe(ZERO);
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
                const factory = fn<() => Nothing>();
                factory.mockReturnValueOnce(expected);
                factory.mockReturnValueOnce(new Nothing());
                const context = new Context().provide(NOTHING, factory);

                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, NOTHING);
                expect(context.inject(NOTHING)).toBe(expected);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, NOTHING);
                expect(context.inject(NOTHING)).toBe(expected);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, NOTHING);

                const otherExpected = new Nothing();
                const otherFactory = fn<() => Nothing>();
                otherFactory.mockReturnValueOnce(otherExpected);
                otherFactory.mockReturnValueOnce(new Nothing());
                const otherContext = new Context().provide(NOTHING, otherFactory);

                expect(otherFactory).toHaveBeenCalledTimes(1);
                expect(otherFactory).nthCalledWith(1, otherContext, NOTHING);
                expect(otherContext.inject(NOTHING)).toBe(otherExpected);
                expect(otherFactory).toHaveBeenCalledTimes(1);
                expect(otherFactory).nthCalledWith(1, otherContext, NOTHING);
                expect(otherContext.inject(NOTHING)).toBe(otherExpected);
                expect(otherFactory).toHaveBeenCalledTimes(1);
                expect(otherFactory).nthCalledWith(1, otherContext, NOTHING);

                const anotherExpected = new Nothing();
                const anotherFactory = fn<() => Nothing>();
                anotherFactory.mockReturnValueOnce(anotherExpected);
                anotherFactory.mockReturnValueOnce(new Nothing());
                const anotherContext = new Context({
                    factory: {
                        lazyFunctionEvaluation: true,
                    }
                }).provide(NOTHING, anotherFactory);

                expect(anotherFactory).not.toHaveBeenCalled();
                expect(anotherContext
                    .inject(NOTHING)).toBe(anotherExpected);
                expect(anotherFactory).toHaveBeenCalledTimes(1);
                expect(anotherFactory).nthCalledWith(1, anotherContext, NOTHING);
                expect(anotherContext.inject(NOTHING)).toBe(anotherExpected);
                expect(anotherFactory).toHaveBeenCalledTimes(1);
                expect(anotherFactory).nthCalledWith(1, anotherContext, NOTHING);
            });

            it('evaluate factory with invocation context', () => {
                const expected = new Nothing();
                const factory = fn(() => expected);
                const context = new Context(new Context()
                    .provide(NOTHING, factory));

                context.inject(NOTHING);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, NOTHING);
            });

            it('caches factory-evaluated value at bean definition context', () => {
                const expected = new Nothing();
                const factory = fn(() => expected);
                const parent = new Context().provide(NOTHING, factory);
                const context = new Context(parent);

                expect(context.inject(NOTHING)).toBe(expected);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, NOTHING);
                expect(parent.inject(NOTHING)).toBe(expected);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, NOTHING);
            });

            it('fail WHEN factory-evaluated value is empty', () => {
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                })
                    .provide(NOTHING, () => null as any as Nothing)
                    .inject(NOTHING)).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
                expect(() => new Context({
                    factory: {
                        lazyFunctionEvaluation: true,
                    }
                })
                    .provide(NOTHING, () => null as any as Nothing)
                    .inject(NOTHING)).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                })
                    .provide(NOTHING, () => undefined as any as Nothing)
                    .inject(NOTHING)).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
                expect(() => new Context({
                    factory: {
                        lazyFunctionEvaluation: true,
                    }
                })
                    .provide(NOTHING, () => undefined as any as Nothing)
                    .inject(NOTHING)).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
            });

            it('fail WHEN promise-resolved value is empty', async () => {
                const NOTHING_PROMISE: Context.Token<Promise<Nothing>> = Symbol('NOTHING_PROMISE');
                await expect(new Context()
                    .provide(NOTHING_PROMISE, Promise.resolve(null as any as Nothing))
                    .inject(NOTHING_PROMISE)
                ).rejects.toHaveProperty('name', Context.ERR_EMPTY_VALUE);
                await expect(new Context()
                    .provide(NOTHING_PROMISE, Promise.resolve(undefined as any as Nothing))
                    .inject(NOTHING_PROMISE)
                ).rejects.toHaveProperty('name', Context.ERR_EMPTY_VALUE);

                const expected = new Nothing();
                await expect(new Context()
                    .provide(NOTHING_PROMISE, Promise.resolve(expected))
                    .inject(NOTHING_PROMISE)
                ).resolves.toBe(expected);
            });

            it('fail WHEN factory-evaluated promise value is empty', async () => {
                const NOTHING_PROMISE: Context.Token<Promise<Nothing>> = Symbol('NOTHING_PROMISE');
                await expect(new Context()
                    .provide(NOTHING_PROMISE, () => Promise.resolve(null as any as Nothing))
                    .inject(NOTHING_PROMISE)
                ).rejects.toHaveProperty('name', Context.ERR_EMPTY_VALUE);
                await expect(new Context()
                    .provide(NOTHING_PROMISE, () => Promise.resolve(undefined as any as Nothing))
                    .inject(NOTHING_PROMISE)
                ).rejects.toHaveProperty('name', Context.ERR_EMPTY_VALUE);

                const expected = new Nothing();
                await expect(new Context()
                    .provide(NOTHING_PROMISE, () => Promise.resolve(expected))
                    .inject(NOTHING_PROMISE)
                ).resolves.toBe(expected);
            });

            it('fail WHEN there is undecidable bean at any level of contexts', () => {
                const expected = new Nothing();
                expect(() => new Context(
                    new Context()
                        .provide(NOTHING, () => expected))
                    .provide(NOTHING, 'home', () => new Nothing())
                    .provide(NOTHING, 'work', () => new Nothing())
                    .inject(NOTHING)).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_UNDECIDABLE_BEAN === thrown.name);
            });

            it('fail WHEN no bean definition the tree has been provided', () => {
                expect(() => new Context().inject('home')).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_NO_BEAN_DEFINITION === thrown.name);
            });
        });

        describe('(token: Context.Token, qualifier: string)', () => {
            const BUILDING: Context.Token<Building> = Symbol('BUILDING');

            class Building {
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
                const factory = fn<() => Building>();
                factory.mockReturnValueOnce(expected);
                factory.mockReturnValueOnce(new Building());
                const context = new Context().provide(BUILDING, 'home', factory);

                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, BUILDING, 'home');
                expect(context.inject(BUILDING, 'home')).toBe(expected);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, BUILDING, 'home');
                expect(context.inject(BUILDING, 'home')).toBe(expected);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, BUILDING, 'home');

                const otherExpected = new Building();
                const otherFactory = fn<() => Building>();
                otherFactory.mockReturnValueOnce(otherExpected);
                otherFactory.mockReturnValueOnce(new Building());
                const otherContext = new Context().provide(BUILDING, 'home', otherFactory);

                expect(otherFactory).toHaveBeenCalledTimes(1);
                expect(otherFactory).nthCalledWith(1, otherContext, BUILDING, 'home');
                expect(otherContext.inject(BUILDING, 'home')).toBe(otherExpected);
                expect(otherFactory).toHaveBeenCalledTimes(1);
                expect(otherFactory).nthCalledWith(1, otherContext, BUILDING, 'home');
                expect(otherContext.inject(BUILDING, 'home')).toBe(otherExpected);
                expect(otherFactory).toHaveBeenCalledTimes(1);
                expect(otherFactory).nthCalledWith(1, otherContext, BUILDING, 'home');

                const anotherExpected = new Building();
                const anotherFactory = fn<() => Building>();
                anotherFactory.mockReturnValueOnce(anotherExpected);
                anotherFactory.mockReturnValueOnce(new Building());
                const anotherContext = new Context({
                    factory: {
                        lazyFunctionEvaluation: true,
                    }
                }).provide(BUILDING, 'home', anotherFactory);

                expect(anotherFactory).not.toHaveBeenCalled();
                expect(anotherContext
                    .inject(BUILDING, 'home')).toBe(anotherExpected);
                expect(anotherFactory).toHaveBeenCalledTimes(1);
                expect(anotherFactory).nthCalledWith(1, anotherContext, BUILDING, 'home');
                expect(anotherContext.inject(BUILDING, 'home')).toBe(anotherExpected);
                expect(anotherFactory).toHaveBeenCalledTimes(1);
                expect(anotherFactory).nthCalledWith(1, anotherContext, BUILDING, 'home');
            });

            it('evaluate factory with invocation context', () => {
                const expected = new Building();
                const factory = fn(() => expected);
                const context = new Context(new Context()
                    .provide(BUILDING, 'home', factory));

                context.inject(BUILDING, 'home');
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, BUILDING, 'home');
            });

            it('caches factory-evaluated value at bean definition context', () => {
                const expected = new Building();
                const factory = fn(() => expected);
                const parent = new Context().provide(BUILDING, 'home', factory);
                const context = new Context(parent);

                expect(context.inject(BUILDING, 'home')).toBe(expected);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, BUILDING, 'home');
                expect(parent.inject(BUILDING, 'home')).toBe(expected);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, BUILDING, 'home');
            });

            it('fail WHEN factory-evaluated value is empty', () => {
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                })
                    .provide(BUILDING, 'home', () => null as any as Building)
                    .inject(BUILDING, 'home')).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
                expect(() => new Context({
                    factory: {
                        lazyFunctionEvaluation: true,
                    }
                })
                    .provide(BUILDING, 'home', () => null as any as Building)
                    .inject(BUILDING, 'home')).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
                expect(() => new Context({
                    factory: {
                        lazyValidation: true,
                    }
                })
                    .provide(BUILDING, 'home', () => undefined as any as Building)
                    .inject(BUILDING, 'home')).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
                expect(() => new Context({
                    factory: {
                        lazyFunctionEvaluation: true,
                    }
                })
                    .provide(BUILDING, 'home', () => undefined as any as Building)
                    .inject(BUILDING, 'home')).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
            });

            it('fail WHEN promise-resolved value is empty', async () => {
                const BUILDING_PROMISE: Context.Token<Promise<Building>> = Symbol('BUILDING_PROMISE');
                await expect(new Context()
                    .provide(BUILDING_PROMISE, 'home', Promise.resolve(null as any as Building))
                    .inject(BUILDING_PROMISE, 'home')
                ).rejects.toHaveProperty('name', Context.ERR_EMPTY_VALUE);
                await expect(new Context()
                    .provide(BUILDING_PROMISE, 'home', Promise.resolve(undefined as any as Building))
                    .inject(BUILDING_PROMISE, 'home')
                ).rejects.toHaveProperty('name', Context.ERR_EMPTY_VALUE);

                const expected = new Building();
                await expect(new Context()
                    .provide(BUILDING_PROMISE, 'home', Promise.resolve(expected))
                    .inject(BUILDING_PROMISE, 'home')
                ).resolves.toBe(expected);
            });

            it('fail WHEN factory-evaluated promise value is empty', async () => {
                const BUILDING_PROMISE: Context.Token<Promise<Building>> = Symbol('BUILDING_PROMISE');
                await expect(new Context()
                    .provide(BUILDING_PROMISE, 'home', () => Promise.resolve(null as any as Building))
                    .inject(BUILDING_PROMISE, 'home')
                ).rejects.toHaveProperty('name', Context.ERR_EMPTY_VALUE);
                await expect(new Context()
                    .provide(BUILDING_PROMISE, 'home', () => Promise.resolve(undefined as any as Building))
                    .inject(BUILDING_PROMISE, 'home')
                ).rejects.toHaveProperty('name', Context.ERR_EMPTY_VALUE);

                const expected = new Building();
                await expect(new Context()
                    .provide(BUILDING_PROMISE, 'home', () => Promise.resolve(expected))
                    .inject(BUILDING_PROMISE, 'home')
                ).resolves.toBe(expected);
            });

            it('fail WHEN no bean definition the tree has been provided', () => {
                expect(() => new Context().inject(BUILDING, 'home')).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_NO_BEAN_DEFINITION === thrown.name);
            });
        });

        describe('(token: Context.Token, injectOptions)', () => {
            const BUILDING_PROMISE: Context.Token<Promise<Building>> = Symbol('BUILDING_PROMISE');
            const BUILDING: Context.Token<Building> = Symbol('BUILDING');

            class Building {
                number?: number;
            }

            it('resolve bean', async () => {
                const expected = new Building();
                expect(new Context()
                    .provide(BUILDING, () => expected)
                    .inject(BUILDING, {})
                ).toBe(expected);
                await expect(new Context()
                    .provide(BUILDING_PROMISE, () => Promise.resolve(expected))
                    .inject(BUILDING_PROMISE, {})
                ).resolves.toBe(expected);

                expect(new Context()
                    .provide(BUILDING, 'work', () => expected)
                    .inject(BUILDING, {qualifier: 'work'})
                ).toBe(expected);
                await expect(new Context()
                    .provide(BUILDING_PROMISE, 'work', () => Promise.resolve(expected))
                    .inject(BUILDING_PROMISE, {qualifier: 'work'})
                ).resolves.toBe(expected);

                let context = new Context();
                let factory: Mock<() => any> = fn(() => expected);
                expect(context
                    .provide(BUILDING, 'work', factory)
                    .inject(BUILDING, {qualifier: 'work', forceEvaluation: false})
                ).toBe(expected);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, BUILDING, 'work');
                context = new Context();
                factory = fn(() => Promise.resolve(expected));
                await expect(new Context()
                    .provide(BUILDING, 'work', factory)
                    .inject(BUILDING, {qualifier: 'work', forceEvaluation: false})
                ).resolves.toBe(expected);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, BUILDING, 'work');
            });

            it('fail WHEN value is empty', async () => {
                expect(() => new Context({factory: {lazyFunctionEvaluation: true}})
                    .provide(BUILDING, () => null as any as Building)
                    .inject(BUILDING, {})).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
                expect(() => new Context({factory: {lazyFunctionEvaluation: true}})
                    .provide(BUILDING, () => undefined as any as Building)
                    .inject(BUILDING, {})).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);

                expect(() => new Context({factory: {lazyFunctionEvaluation: true}})
                    .provide(BUILDING, 'home', () => null as any as Building)
                    .inject(BUILDING, {qualifier: 'home'})).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
                expect(() => new Context({factory: {lazyFunctionEvaluation: true}})
                    .provide(BUILDING, 'home', () => undefined as any as Building)
                    .inject(BUILDING, {qualifier: 'home'})).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);

                await expect(new Context({factory: {lazyFunctionEvaluation: true}})
                    .provide(BUILDING_PROMISE, () => Promise.resolve(null as any as Building))
                    .inject(BUILDING_PROMISE, {})
                ).rejects.toHaveProperty('name', Context.ERR_EMPTY_VALUE);
                await expect(new Context({factory: {lazyFunctionEvaluation: true}})
                    .provide(BUILDING_PROMISE, () => Promise.resolve(undefined as any as Building))
                    .inject(BUILDING_PROMISE, {})
                ).rejects.toHaveProperty('name', Context.ERR_EMPTY_VALUE);

                let context = new Context();
                let factory: Mock<() => any> = fn(() => Promise.resolve(null));
                await expect(context
                    .provide(BUILDING, 'work', factory)
                    .inject(BUILDING, {qualifier: 'work', forceEvaluation: false})
                ).rejects.toHaveProperty('name', Context.ERR_EMPTY_VALUE);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, BUILDING, 'work');
                context = new Context();
                factory = fn(() => Promise.resolve(undefined));
                await expect(new Context()
                    .provide(BUILDING, 'work', factory)
                    .inject(BUILDING, {qualifier: 'work', forceEvaluation: false})
                ).rejects.toHaveProperty('name', Context.ERR_EMPTY_VALUE);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, BUILDING, 'work');
            });

            it('revaluate factory and validate value WHEN injectOptions.forceEvaluation === true, without caching the result', async () => {
                const [ZERO, ONE, TWO] = [new Building(), new Building(), new Building()];
                let factory = fn<() => any>();
                factory.mockReturnValueOnce(ZERO);
                factory.mockReturnValueOnce(ONE);
                factory.mockReturnValueOnce(TWO);
                let context = new Context().provide(BUILDING, factory);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, BUILDING);
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

                factory = fn<() => Building>();
                factory.mockReturnValueOnce(ZERO);
                factory.mockReturnValueOnce(null);
                factory.mockReturnValueOnce(undefined);
                factory.mockReturnValueOnce(TWO);
                context = new Context().provide(BUILDING, factory);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, BUILDING);
                expect(() => context.inject(BUILDING, {
                    forceEvaluation: true,
                })).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
                expect(factory).toHaveBeenCalledTimes(2);
                expect(() => context.inject(BUILDING, {
                    forceEvaluation: true,
                })).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
                expect(factory).toHaveBeenCalledTimes(3);
                expect(context.inject(BUILDING, {
                    forceEvaluation: true,
                })).toBe(TWO);
                expect(factory).toHaveBeenCalledTimes(4);
                expect(context.inject(BUILDING, {})).toBe(ZERO);
                expect(factory).toHaveBeenCalledTimes(4);

                factory = fn<() => Promise<Building>>();
                factory.mockReturnValueOnce(Promise.resolve(ZERO));
                factory.mockReturnValueOnce(Promise.resolve(ONE));
                factory.mockReturnValueOnce(Promise.resolve(TWO));
                context = new Context().provide(BUILDING_PROMISE, factory);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, BUILDING_PROMISE);
                await expect(context.inject(BUILDING_PROMISE, {
                    forceEvaluation: true,
                })).resolves.toBe(ONE);
                expect(factory).toHaveBeenCalledTimes(2);
                await expect(context.inject(BUILDING_PROMISE, {
                    forceEvaluation: true,
                })).resolves.toBe(TWO);
                expect(factory).toHaveBeenCalledTimes(3);
                await expect(context.inject(BUILDING_PROMISE, {})).resolves.toBe(ZERO);
                expect(factory).toHaveBeenCalledTimes(3);

                factory = fn<() => Promise<Building>>();
                factory.mockReturnValueOnce(Promise.resolve(ZERO));
                factory.mockReturnValueOnce(Promise.resolve(null));
                factory.mockReturnValueOnce(Promise.resolve(undefined));
                factory.mockReturnValueOnce(Promise.resolve(TWO));
                context = cached(new Context()).provide(BUILDING_PROMISE, factory);
                cached.silenced(BUILDING_PROMISE);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, BUILDING_PROMISE);
                await expect(context.inject(BUILDING_PROMISE, {
                    forceEvaluation: true,
                })).rejects.toHaveProperty('name', Context.ERR_EMPTY_VALUE);
                expect(factory).toHaveBeenCalledTimes(2);
                await expect(context.inject(BUILDING_PROMISE, {
                    forceEvaluation: true,
                })).rejects.toHaveProperty('name', Context.ERR_EMPTY_VALUE);
                expect(factory).toHaveBeenCalledTimes(3);
                await expect(context.inject(BUILDING_PROMISE, {
                    forceEvaluation: true,
                })).resolves.toBe(TWO);
                expect(factory).toHaveBeenCalledTimes(4);
                await expect(context.inject(BUILDING_PROMISE, {})).resolves.toBe(ZERO);
                expect(factory).toHaveBeenCalledTimes(4);

                factory = fn<() => Building>();
                factory.mockReturnValueOnce(ZERO);
                factory.mockReturnValueOnce(ONE);
                factory.mockReturnValueOnce(TWO);
                context = new Context().provide(BUILDING, '1-step', factory);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, BUILDING, '1-step');
                expect(context.inject(BUILDING, {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).toBe(ONE);
                expect(factory).toHaveBeenCalledTimes(2);
                expect(context.inject(BUILDING, {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).toBe(TWO);
                expect(factory).toHaveBeenCalledTimes(3);
                expect(context.inject(BUILDING, {
                    qualifier: '1-step',
                })).toBe(ZERO);
                expect(factory).toHaveBeenCalledTimes(3);

                factory = fn<() => Building>();
                factory.mockReturnValueOnce(ZERO);
                factory.mockReturnValueOnce(null);
                factory.mockReturnValueOnce(undefined);
                factory.mockReturnValueOnce(TWO);
                context = new Context().provide(BUILDING, '1-step', factory);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, BUILDING, '1-step');
                expect(() => context.inject(BUILDING, {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
                expect(factory).toHaveBeenCalledTimes(2);
                expect(() => context.inject(BUILDING, {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
                expect(factory).toHaveBeenCalledTimes(3);
                expect(context.inject(BUILDING, {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).toBe(TWO);
                expect(factory).toHaveBeenCalledTimes(4);
                expect(context.inject(BUILDING, {
                    qualifier: '1-step',
                })).toBe(ZERO);
                expect(factory).toHaveBeenCalledTimes(4);

                factory = fn<() => Promise<Building>>();
                factory.mockReturnValueOnce(Promise.resolve(ZERO));
                factory.mockReturnValueOnce(Promise.resolve(ONE));
                factory.mockReturnValueOnce(Promise.resolve(TWO));
                context = new Context().provide(BUILDING_PROMISE, '1-step', factory);
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, BUILDING_PROMISE, '1-step');
                await expect(context.inject(BUILDING_PROMISE, {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).resolves.toBe(ONE);
                expect(factory).toHaveBeenCalledTimes(2);
                await expect(context.inject(BUILDING_PROMISE, {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).resolves.toBe(TWO);
                expect(factory).toHaveBeenCalledTimes(3);
                await expect(context.inject(BUILDING_PROMISE, {
                    qualifier: '1-step',
                })).resolves.toBe(ZERO);
                expect(factory).toHaveBeenCalledTimes(3);

                factory = fn<() => Promise<Building>>();
                factory.mockReturnValueOnce(Promise.resolve(ZERO));
                factory.mockReturnValueOnce(Promise.resolve(null));
                factory.mockReturnValueOnce(Promise.resolve(undefined));
                factory.mockReturnValueOnce(Promise.resolve(TWO));
                context = cached(new Context()).provide(BUILDING_PROMISE, '1-step', factory);
                cached.silenced(BUILDING_PROMISE, '1-step');
                expect(factory).toHaveBeenCalledTimes(1);
                expect(factory).nthCalledWith(1, context, BUILDING_PROMISE, '1-step');
                await expect(context.inject(BUILDING_PROMISE, {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).rejects.toHaveProperty('name', Context.ERR_EMPTY_VALUE);
                expect(factory).toHaveBeenCalledTimes(2);
                await expect(context.inject(BUILDING_PROMISE, {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).rejects.toHaveProperty('name', Context.ERR_EMPTY_VALUE);
                expect(factory).toHaveBeenCalledTimes(3);
                await expect(context.inject(BUILDING_PROMISE, {
                    forceEvaluation: true,
                    qualifier: '1-step',
                })).resolves.toBe(TWO);
                expect(factory).toHaveBeenCalledTimes(4);
                await expect(context.inject(BUILDING_PROMISE, {
                    qualifier: '1-step',
                })).resolves.toBe(ZERO);
                expect(factory).toHaveBeenCalledTimes(4);
            });
        });

        describe('(noBeanDefinitionNoArgumentConstructor, qualifier?)', () => {
            let Product: { new(): { brand?: string | undefined } };
            let constructorSpy: jest.Mock<(...args: any[]) => any>;
            let context: Context;
            beforeEach(() => {
                context = new Context();
                Product = class ProductType {
                    constructor(public brand: string | undefined = undefined) {
                        constructorSpy(...arguments);
                    }
                };
                constructorSpy = fn();
            });

            it('throws error when the constructor require at least one argument', () => {
                expect(() => context.inject(class Product {
                    constructor(public brand: string) {
                    }
                })).toThrowError((thrown: any) =>
                    thrown instanceof Error && Context.ERR_NO_BEAN_DEFINITION === thrown.name)
            });

            it('create an instance of that class, caches it and return it', () => {
                const injected = context.inject(Product);
                expect(injected).toBeInstanceOf(Product);
                expect(context.inject(Product)).toBe(injected);
                expect(constructorSpy).toHaveBeenCalledTimes(1);
                expect(constructorSpy).nthCalledWith(1);
            });

            it('create an instance of that class, caches it under the given qualifier and return it', () => {
                const injected = context.inject(Product, 'useful');
                expect(injected).toBeInstanceOf(Product);
                expect(context.inject(Product, 'useful')).toBe(injected);
                expect(constructorSpy).toHaveBeenCalledTimes(1);
                expect(constructorSpy).nthCalledWith(1);
            });

            it('resolve default qualifier of only qualified bean', () => {
                const injected = context.inject(Product, 'useful');
                expect(injected).toBeInstanceOf(Product);
                expect(context.inject(Product)).toBe(injected);
                expect(constructorSpy).toHaveBeenCalledTimes(1);
                expect(constructorSpy).nthCalledWith(1);
            });
        });
    });

    describe('when the injected bean is a promise', () => {
        it('wrap it into the context-aware promise implementation', async () => {
            const NUMBER_PROMISE: Token<PromiseLike<number>> = Symbol('NUMBER_PROMISE');
            expect(new Context()
                .provide(NUMBER_PROMISE, Promise.resolve(1))
                .inject(NUMBER_PROMISE)
            ).toBeInstanceOf(ContextPromise);
        });

        it('wrap it into the context-aware promise with type support', async () => {
            type T = Token<PromiseLike<number>>;
            class Bench extends ContextPromise<number> {
                sitsCount?: number;
            }

            let [token, context, onRejected, onFulfilled] = ['token' as T, new Context(), fn(), fn()];
            await expect(context
                .provide(token, async () => 1)
                .inject(token)).resolves.toBe(1);

            [token, context, onRejected, onFulfilled] = [Bench, new Context(), fn(), fn()];
            await context
                .provide(token, new Bench(res => res(2)))
                .inject(token)
                .then(onFulfilled, onRejected);
            expect(onFulfilled).nthCalledWith(1, 2, context);
            expect(onRejected).not.toHaveBeenCalled();

            [token, context, onRejected, onFulfilled] = [Symbol('REPLICAS_COUNT'), new Context(), fn(), fn()];
            await context
                .provide(token, ContextPromise.resolve(3))
                .inject(token)
                .then(onFulfilled, onRejected);
            expect(onFulfilled).nthCalledWith(1, 3, context);
            expect(onRejected).not.toHaveBeenCalled();

        });
    })

    describe('bug fix', () => {
        it('do not resolve value WHEN injecting with forceEvaluation === true and it was provided with a factory', () => {
            const fibonacciFactory = fn<() => number | undefined>();
            fibonacciFactory.mockReturnValueOnce(0);
            fibonacciFactory.mockReturnValueOnce(undefined);
            expect(() => new Context()
                .provide('fibonacci', fibonacciFactory)
                .inject('fibonacci', {forceEvaluation: true})
            ).toThrowError((thrown: any) =>
                thrown instanceof Error && Context.ERR_EMPTY_VALUE === thrown.name);
        });

        it('call factory with the context on which the bean definition was provided', () => {
            let gravityFactory = fn(() => 9.807);
            const context = new Context().provide('gravity', gravityFactory);
            expect(gravityFactory).toHaveBeenCalledTimes(1);
            expect(gravityFactory).nthCalledWith(1, context, 'gravity');

            gravityFactory = fn(() => 9.807);
            const parent = new Context({factory: {lazyFunctionEvaluation: true}})
                .provide('gravity', gravityFactory);
            new Context(parent).inject('gravity');
            expect(gravityFactory).toHaveBeenCalledTimes(1);
            expect(gravityFactory).nthCalledWith(1, parent, 'gravity');
        });

        it('inject resolve bean definition (both bean and factory) one context level at a time', () => {
            expect(new Context({
                        factory: {
                            lazyFunctionEvaluation: true,
                        },
                    },
                    new Context().provide('not-so-random', () => 'Oh') // Eager parent
                ).provide('not-so-random', () => 'WoW') // Lazy child
                    .inject('not-so-random') // Should resolve to child bean definition
            ).toBe('WoW');
        });
    });
});

const cached: {
    context?: Context;
    /**
     * Some hack to deal with Jest/NodeJS non-zero exit status upon "unhandledRejection".
     *
     * Now since those aren't actual test cases failing but a side effect... It got interesting.
     *
     * @param context
     */<C extends Context>(context: C): C;
    silenced(...args: [token: any, qualifier?: string]): void;
} = <C extends Context>(context: C) => cached.context = context;
cached.silenced = (...args: [token: any, qualifierOrOptions?: any]) =>
    (cached.context?.inject(...args) as PromiseLike<any>).then(null, _ => _);
