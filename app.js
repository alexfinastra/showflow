var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var flash = require('express-flash');
var session = require('express-session');

var index = require('./routes/index');
var interface = require('./routes/interface');
var channel = require('./routes/channel');
var flow = require('./routes/flow');
var folder = require('./routes/folder');
var queue = require('./routes/queue');

var expressValidator = require('express-validator');
var methodOverride = require('method-override');

var app = express();
global.appRoot = path.resolve(__dirname);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({secret:"secretpass123456"}));
app.use(flash());
app.use(expressValidator());
app.use(methodOverride(function(req, res){
 if (req.body && typeof req.body == 'object' && '_method' in req.body) 
 { 
  var method = req.body._method;
  delete req.body._method;
  return method;
} 
}));

app.use(express.static(path.join(__dirname, 'public'))); 
app.use(express.static(path.join(__dirname, 'exports'))); 
app.use(express.static(path.join(__dirname, 'env')));

app.use('/', index);
app.use('/interface', interface);
app.use('/channel', channel);
app.use('/flow', flow);
app.use('/folder', folder);
app.use('/queue', queue);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
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
