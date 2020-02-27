module.exports = {
    errorHandler(err) {
      console.log(err);
      throw new Error(err.message || "unknown error");
    },
    log(message) {
      const { LOGGER } = process.env;
      if (LOGGER) console.log(message);
    }
  };
  