const isProd = process.env.NODE_ENV === 'production';

function timestamp() {
    return new Date().toISOString();
}

function format(level, scope, message) {
    return `[${timestamp()}] ${level} [${scope}] ${message}`;
}

export const logger = {
    info(scope, message) {
        console.log(format('INFO ', scope, message));
    },

    success(scope, message) {
        console.log(format('OK   ', scope, `✓ ${message}`));
    },

    warn(scope, message) {
        console.warn(format('WARN ', scope, `⚠ ${message}`));
    },

    error(scope, message, err) {
        console.error(format('ERROR', scope, `✗ ${message}`));
        if (err) {
            console.error(isProd ? `  ${err.message}` : (err.stack ?? err));
        }
    },

    debug(scope, message) {
        if (isProd) return;
        console.log(format('DEBUG', scope, message));
    },
};
