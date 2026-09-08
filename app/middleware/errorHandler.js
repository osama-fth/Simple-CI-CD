'use strict';

const createError = require('http-errors');
const logger = require('../utils/logger');

/**
 * Middleware 404 per risorse non trovate
 */
function notFoundHandler(req, res, next) {
  next(createError(404));
}

/**
 * Middleware centralizzato per la gestione degli errori HTTP e di runtime
 */
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  logger.error(`HTTP ${status} su [${req.method} ${req.originalUrl}] - ${err.message}`);

  if (res.headersSent) {
    return next(err);
  }

  res.status(status).send(status === 404 ? 'Risorsa non trovata' : 'Si è verificato un errore interno');
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
