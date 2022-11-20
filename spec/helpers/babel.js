const babelRegister = require('@babel/register/experimental-worker');

babelRegister({
    presets: [
        '@babel/preset-typescript',
        'minify'
    ],
    plugins: [
        ['module-resolver', {
            alias: {
                '@squall.io/context': '..'
            }
        }],
        '@babel/plugin-transform-modules-commonjs'
    ],
    extensions: ['.ts'],
    cache: false
});
