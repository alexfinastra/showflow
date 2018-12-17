var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var flash = require('express-flash');
var session = require('express-session');

var index = require('./routes/index');
var onboard = require('./routes/onboard');
var usecases = require('./routes/usecases');
var payments = require('./routes/payments');

var expressValidator = require('express-validator');
//var methodOverride = require('method-override');

var app = express();
global.appRoot = path.resolve(__dirname);
global.currentFlow = "";


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
    secret: "secretpass123456",
    resave: false,
    saveUninitialized: false
}));
app.use(flash());
app.use(expressValidator());
app.use(express.static(path.join(__dirname, 'public'))); 

app.use('/', index);
app.use('/onboard', onboard);
app.use('/usecases', usecases);
app.use('/payments', payments);

// catch 404 and forward to error handler
app.use(function(req, res, next) {  
  //var err = new Error('Not Found');
  //err.status = 404;
  //next(err);
  res.render('404.jade');
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
