'use strict';

const morgan = require('morgan');

function timestamp() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

const logger = {
  info(msg, ...args) {
    console.log(`[info] [${timestamp()}] ${msg}`, ...args);
  },

  error(msg, ...args) {
    console.error(`[error] [${timestamp()}] ${msg}`, ...args);
  },

  auth(msg, ...args) {
    console.log(`[auth] [${timestamp()}] ${msg}`, ...args);
  },

  warn(msg, ...args) {
    console.warn(`[warn] [${timestamp()}] ${msg}`, ...args);
  },

  http(msg) {
    console.log(`[http] [${timestamp()}] ${String(msg).trim()}`);
  },

  morganMiddleware() {
    return morgan(':method :url :status :res[content-length] - :response-time ms', {
      stream: {
        write: (message) => {
          logger.http(message);
        },
      },
      skip: (req) => req.url === '/favicon.ico',
    });
  },
};

module.exports = logger;
