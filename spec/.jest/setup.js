expect.extend({
    toThrowError(fn, expectation) {
        try {
            fn();
            // noinspection ExceptionCaughtLocallyJS
            throw new Error("Should have thrown an error: it didn't.")
        } catch (error) {
            let [pass, message] = [false, null];

            if ('function' === typeof expectation) {
                pass = expectation(error);
                pass && (message = 'Failed to pass predicate.');
            } else if ('string' === typeof expectation) {
                if (error instanceof Error) {
                    pass = expectation === error.message;
                    pass && (message = 'Error message mismatch expectation.');
                } else if ('string' === typeof error) {
                    pass = expectation === error;
                    pass && (message = 'Error mismatch expectation.');
                } else {
                    pass = false;
                    message = 'Cannot match error with expectation: incoherent types.';
                }
            } else if (expectation instanceof RegExp) {
                if (error instanceof Error) {
                    pass = expectation.test(error.message);
                    pass && (message = 'Error message mismatch expectation.');
                } else if ('string' === typeof error) {
                    pass = expectation.test(error);
                    pass && (message = 'Error mismatch expectation.');
                } else {
                    pass = false;
                    message = 'Cannot match error with expectation: incoherent types.';
                }
            }

            return {pass, message: () => message};
        }
    }
});
