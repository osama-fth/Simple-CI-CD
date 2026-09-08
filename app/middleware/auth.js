'use strict';

const userDAO = require('../models/dao/userDAO');
const logger = require('../utils/logger');

/**
 * Middleware di protezione per rotte riservate agli operatori accreditati
 */
function ensureOperator(req, res, next) {
  if (req.isAuthenticated() && req.user && userDAO.isOperator(req.user)) {
    return next();
  }
  if (req.isAuthenticated()) {
    logger.auth(`Richiesta non autorizzata su [${req.originalUrl}] da @${req.user?.username}`);
    return res.status(403).send('Accesso riservato agli operatori accreditati');
  }
  return res.redirect('/login');
}

/**
 * Middleware per impedire l'accesso alla pagina di login agli operatori già autenticati
 */
function ensureGuest(req, res, next) {
  if (req.isAuthenticated() && req.user) {
    return res.redirect('/');
  }
  return next();
}

module.exports = {
  ensureOperator,
  ensureGuest,
};
