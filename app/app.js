var createError = require('http-errors');
var express = require('express');
var logger = require('morgan');
var indexRouter = require('./routes/index');

var app = express();

app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

app.use('/', indexRouter);

app.get([
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/apple-touch-icon-precomposed.png',
  /^.*\.ico$/,
], (req, res) => {
  res.status(204).end();
});

app.use(function(req, res, next) {
  next(createError(404));
});

module.exports = app;
