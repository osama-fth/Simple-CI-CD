'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const createError = require('http-errors');
const express = require('express');
const helmet = require('helmet');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const { passport } = require('./auth');
const logger = require('./utils/logger');
const indexRouter = require('./routes/index');

const app = express();

const isProduction = process.env.NODE_ENV === 'production';

// Disabilita fingerprinting del framework
app.disable('x-powered-by');

// Configurazione Content Security Policy differenziata per ambiente
const cspDirectives = {
  defaultSrc: ["'self'"],
  styleSrc: ["'self'", 'https://cdn.jsdelivr.net'],
  scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'],
  fontSrc: ["'self'", 'https://cdn.jsdelivr.net'],
  imgSrc: ["'self'", 'data:'],
  frameAncestors: ["'none'"],
  objectSrc: ["'none'"],
};

// In locale / development HTTP disabilita upgradeInsecureRequests per evitare forzatura ad HTTPS con errore TLS
if (!isProduction) {
  cspDirectives.upgradeInsecureRequests = null;
}

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: cspDirectives,
    },
    // HSTS attivo solo in produzione con HTTPS; disattivato in locale HTTP per prevenire errori TLS
    hsts: isProduction ? { maxAge: 31536000, includeSubDomains: true } : false,
    crossOriginEmbedderPolicy: false,
  }),
);

// Logging HTTP centralizzato tramite wrapper Morgan
app.use(logger.morganMiddleware());

// Parsing richieste
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(express.static('public'));

// Gestione sessioni per operatori
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'biblioteca-session-secret-key-32chars',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
      maxAge: 8 * 60 * 60 * 1000,
    },
  }),
);

// Inizializzazione Passport
app.use(passport.initialize());
app.use(passport.session());

// Rate limiter per endpoint di autenticazione e scrittura
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Troppi tentativi di accesso. Riprova tra 15 minuti.',
});

const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Frequenza di operazioni troppo elevata. Riprova più tardi.',
});

app.use('/login', authLimiter);
app.use(['/prestiti', '/libri', '/tesserati', '/copie'], writeLimiter);

// Motore viste
app.set('view engine', 'ejs');

// Rotte applicative
app.use('/', indexRouter);

app.get([
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/apple-touch-icon-precomposed.png',
  /^.*\.ico$/,
], (req, res) => {
  res.status(204).end();
});

// Gestione 404
app.use(function(req, res, next) {
  next(createError(404));
});

// Centralized error handler con logger [error]
app.use(function(err, req, res, next) {
  const status = err.status || 500;
  logger.error(`HTTP ${status} su [${req.method} ${req.originalUrl}] - ${err.message}`);
  if (res.headersSent) {
    return next(err);
  }
  res.status(status).send(status === 404 ? 'Risorsa non trovata' : 'Si è verificato un errore interno');
});

module.exports = app;
