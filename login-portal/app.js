var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require("express-session");
var okta = require("@okta/okta-sdk-nodejs");
var ExpressOIDC = require("@okta/oidc-middleware").ExpressOIDC;

//var indexRouter = require('./routes/index');
//var usersRouter = require('./routes/users');

const dashboardRouter = require("./routes/dashboard");         
const publicRouter = require("./routes/public");
const usersRouter = require("./routes/users");


var app = express();

var oktaClient = new okta.Client({
  orgUrl: 'https://dev-786192.oktapreview.com',
  token: '003kf7fJbUaZrozpII9YIpKCImLn7PH0e6imB9f5qe'
});

const oidc = new ExpressOIDC({
  issuer: 'https://dev-786192.oktapreview.com/oauth2/default',
  client_id: '0oagcbm2yg7dDZDTh0h7',
  client_secret: 'q5AUQNlZBYOqDZMv6zFgaBcAm3jyHztzLGGTDG4G',
  redirect_uri: 'http://localhost:3000/users/callback',
  scope: "openid profile",
  routes: {
    login: {
      path: "/users/login"
    },
    callback: {
      path: "/users/callback",
      defaultRedirect: "/dashboard"
    }
  }
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'SKARABISM_IS_A_LIFESTYLE',
  resave: true,
  saveUninitialized: false
}));

app.use(session({
  secret: 'asdf;lkjh3lkjh235l23h5l235kjh',
  resave: true,
  saveUninitialized: false
}));
app.use(oidc.router);

app.use((req, res, next) => {
  if (!req.userinfo) {
    return next();
  }

  oktaClient.getUser(req.userinfo.sub)
    .then(user => {
      req.user = user;
      res.locals.user = user;
      next();
    }).catch(err => {
      next(err);
    });
});



app.get('/test', (req, res) => {
  res.json({ profile: req.user ? req.user.profile : null });
});


function loginRequired(req, res, next) {
  if (!req.user) {
    return res.status(401).render("unauthenticated");
  }

  next();
}


//app.use('/', indexRouter);
//app.use('/users', usersRouter);

app.use('/', publicRouter);
app.use('/dashboard', loginRequired, dashboardRouter);
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
