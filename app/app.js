var createError = require('http-errors');
var express = require('express');
var logger = require('morgan');
require('dotenv').config();
var indexRouter = require('./routes/index');

var app = express();

// view engine setup
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

module.exports = app;
