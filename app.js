var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var fs = require('fs');

// set ENV
require('dotenv').config();

// check root dir exist
try {
  fs.accessSync(process.env.ROOTPATH, fs.constants.R_OK | fs.constants.W_OK);
  console.log('root exist, and permission ok!');
} catch (err) {
  console.error('root is not exist, or permission denied!');
  console.log('create root...');
  try {
    fs.mkdirSync( process.env.ROOTPATH )
    console.log('root created');
  } catch (error) {
    console.error(error);
  }
  
}


// configure cors
const corsOption = {
  "origin": ["http://localhost:3000", "http://192.168.43.90:4200", "http://192.168.43.219:4200","http://localhost:4200", process.env.FrontendIP, "http://192.168.43.219:3008"],
  "credentials": true,
  "exposedHeaders":["Content-Disposition","X-AICLOUD-ENDLOG"]
}



// 建立Mongoservice(自定義service)
const MongoService = require('./services/MongoService.js');
MongoService.init();

// 建立使用者權限api
const {createRouter: creatAuthRoter} = require('./routes/authRouter.js');
var authRoter = creatAuthRoter({});

// 初始化router : 相依注入Root-router
const {creatRouter: createRootRouter} = require('./routes/index.js');
var indexRouter = createRootRouter({authRoter});
//var printURL = require('./middlewares/printRequestURL.js');
var usersRouter = require('./routes/users');

var app = express();

// solve cors error
app.use(cors(corsOption)); // add an middleware

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
// 初始化express build-in middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 串接router
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

  // my error
  res.locals.myError = 'fuck hey';
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
