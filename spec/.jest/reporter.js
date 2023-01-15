const {BaseReporter} = require('@jest/reporters');
const {magenta, cyan, red} = require('chalk');

class ContextReporter extends BaseReporter {
    onTestCaseResult(test, testCaseResult) {
        console.error([...testCaseResult.ancestorTitles, testCaseResult.title]
            .reduce((r, e, i) => (r ? r + magenta(' · ') : r) + cyan(e), ''));

        if ('failed' === testCaseResult.status) {
            console.error(...testCaseResult.failureMessages.map(red));
        }
    }
}

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.default = ContextReporter;
