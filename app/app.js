'use strict';

const createError = require('http-errors');
const express = require('express');
const logger = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const indexRouter = require('./routes/index');

const app = express();

// Disabilita fingerprinting del framework
app.disable('x-powered-by');

// Security headers con Content Security Policy per CDN Bootstrap
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", 'https://cdn.jsdelivr.net'],
        scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'],
        fontSrc: ["'self'", 'https://cdn.jsdelivr.net'],
        imgSrc: ["'self'", 'data:'],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);

// Rate limiter per endpoint applicativi
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Troppe richieste di registrazione/restituzione, riprova più tardi.',
});

app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(express.static('public'));

app.use('/prestiti', writeLimiter);
app.use('/', indexRouter);

app.get([
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/apple-touch-icon-precomposed.png',
  /^.*\.ico$/,
], (req, res) => {
  res.status(204).end();
});

// 404 handler
app.use(function(req, res, next) {
  next(createError(404));
});

// Centralized error handler
app.use(function(err, req, res, next) {
  const status = err.status || 500;
  console.error(`[App Error] ${status} - ${err.message}`);
  if (res.headersSent) {
    return next(err);
  }
  res.status(status).send(status === 404 ? 'Risorsa non trovata' : 'Si è verificato un errore interno');
});

module.exports = app;

