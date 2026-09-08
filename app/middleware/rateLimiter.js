'use strict';

const rateLimit = require('express-rate-limit');

/**
 * Limitatore tentativi di accesso (brute-force prevention)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Troppi tentativi di accesso. Riprova tra 15 minuti.',
});

/**
 * Limitatore per operazioni di scrittura / modifica stato
 */
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Frequenza di operazioni troppo elevata. Riprova più tardi.',
});

module.exports = {
  authLimiter,
  writeLimiter,
};
