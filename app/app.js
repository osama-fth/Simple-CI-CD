'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const helmet = require('helmet');
const session = require('express-session');
const { passport } = require('./auth');
const logger = require('./utils/logger');
const { authLimiter, writeLimiter } = require('./middleware/rateLimiter');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
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

// Applicazione rate limiters da middleware dedicato
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

// Middleware 404 e gestione centralizzata errori da middleware/errorHandler.js
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
