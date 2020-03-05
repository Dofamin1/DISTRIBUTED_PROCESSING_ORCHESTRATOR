const levels = {
    DEBUG: 1,
    INFO: 2,
    ERROR: 3,
};
const handlers = new Map([
    [levels.DEBUG, console.log],
    [levels.ERROR, console.error],
    [levels.INFO, console.log]
]);

module.exports = {
    levels: levels,
    errorHandler(err) {
        console.log(err);
        throw new Error(err.message || "unknown error");
    },
    log(message, level = levels.INFO) {
        const {LOGGER, LEVEL = levels.INFO} = process.env;
        if (LOGGER && LEVEL <= level) {
            const handler = handlers.get(level);
            handler(message);
        }
    }
};
  