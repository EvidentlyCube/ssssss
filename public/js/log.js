
const LOG_LEVEL_MAP = {
    0: "DEBUG",
    1: "INFO",
    2: "WARN",
    3: "ERROR"
}

const LOG = (level, text, data) => {
    if (level < LOG_LEVEL) {
        return;
    }

    const logName = LOG_LEVEL_MAP[level] || `UNKNOWN-{$level}`;
    console.log(`[${logName}] ${text}`);
    if (typeof data !== 'undefined') {
        console.log(data);
    }
}

LOG.debug = (text, data) => LOG(0, text, data);
LOG.info = (text, data) => LOG(1, text, data);
LOG.warn = (text, data) => LOG(2, text, data);
LOG.error = (text, data) => LOG(3, text, data);