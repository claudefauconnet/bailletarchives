var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));

app.use(function(req, res, next) {
    if( true && req.headers.origin) {
        var origin = req.headers.origin.toLowerCase();
        var isLocal=origin.indexOf("localhost")>-1  || origin.indexOf("127.0.0.1")>-1
        var isNotHttps=origin.indexOf("https")<0
        if( !isLocal && isNotHttps){
            //   var err = new Error("HTTP protocol ins not allowed , use secure HTTPS  protocol");
            //   err.status = 403;
            return res.sendStatus(403);
            next(err);
        }
    }
    next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
