/*jshint node: true */

'use strict';

var gulp = require('gulp');

var argv = require('yargs').argv;
var concat = require('gulp-concat');
var connect = require('connect');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var http = require('http');
var jshint = require('gulp-jshint');
var less = require('gulp-less');
var karma = require('karma').server;
var path = require('path');
var proxy = require('proxy-middleware');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var url = require('url');

var options = {
  appPort: argv['app-port'] || 9070,
  mlHost: argv['ml-host'] || 'localhost',
  mlPort: argv['ml-port'] || '8070'
};

// start express
gulp.task('start', function () {
  var express = require('express');
  var app = express();

  app.use(cookieParser());
  app.use(expressSession({secret: '1234567890QWERTY'}));

  app.get('/v1*', function(req, res){
    var queryString = req.originalUrl.split('?')[1];
    http.get({
      hostname: options.mlHost,
      port: options.mlPort,
      path: req.path + (queryString ? '?' + queryString : ''),
      headers: req.headers,
      auth: (req.session.username || 'demo-cat-user') + ':' + (req.session.password || 'c2t2l0g')
    }, function(response) {
      response.on('data', function(chunk) {
        res.send(chunk);
      });
    });
  });

  app.get('/user/status', function(req, res) {
    if (req.session.user === undefined) {
      res.send('{"authenticated": false}');
    } else {
      res.send(req.session.user);
    }
  });

  app.get('/user/login', function(req, res) {
    // need to attempt to read a document that we know exists
    // or maybe we can try to read the profile and distinguish between 401 and 404
    // 404 - valid credentials, but no profile yet
    // 401 - bad credentials
    console.log('auth is ' + req.query.username + ':' + req.query.password);
    var login = http.get({
      hostname: options.mlHost,
      port: options.mlPort,
      path: '/v1/documents?uri=/users/' + req.query.username + '.json',
      headers: req.headers,
      auth: req.query.username + ':' + req.query.password
    }, function(response) {
      console.log('response is ' + response.statusCode);
      if (response.statusCode === 401) {
        res.statusCode = 401;
        res.send('Unauthenticated');
      } else {
        if (response.statusCode === 200) {
          req.session.username = req.query.username;
          req.session.password = req.query.password;
          response.on('data', function(chunk) {
            var json = JSON.parse(chunk);
            console.log('chunk: ' + json);
            if (json.user !== undefined) {
              req.session.emails = json.user.emails;
              var sendBack = {
                authenticated: true,
                username: req.query.username,
                profile: {
                  fullname: json.user.fullname,
                  emails: json.user.emails
                }
              };
              console.log('sending response: ' + JSON.stringify(sendBack));
              res.send(200, sendBack);
            } else {
              console.log('did not find chunk.user');
            }
          });
        }
      }
    });

    login.on('error', function(e) {
      console.log('login failed: ' + e.statusCode);
    });
  });

  app.use(express.static('ui/app'));
  app.listen(4000);
});

gulp.task('jshint', function() {
  gulp.src('ui/app/scripts/**/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

// Compile Our Less
gulp.task('less', function() {
  return gulp.src('ui/app/styles/*.less')
    .pipe(less())
    .pipe(gulp.dest('ui/app/styles/'));
});

// Concatenate & Minify JS
gulp.task('scripts', function() {
  return gulp.src('./ui/app/scripts/**/*.js')
    .pipe(concat('all.js'))
    .pipe(gulp.dest('dist'))
    .pipe(rename('all.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('dist'));
});

// Watch Files For Changes
gulp.task('watch', function() {
  gulp.watch('./ui/app/scripts/**/*.js', ['jshint', 'scripts']);
  gulp.watch('./ui/app/styles/*.less', ['less']);
});

gulp.task('test', function() {
  karma.start({
    configFile: path.join(__dirname, './karma.conf.js'),
    singleRun: true,
    autoWatch: false
  }, function (exitCode) {
    console.log('Karma has exited with ' + exitCode);
    process.exit(exitCode);
  });
});

gulp.task('autotest', function() {
  karma.start({
    configFile: path.join(__dirname, './karma.conf.js'),
    autoWatch: true
  }, function (exitCode) {
    console.log('Karma has exited with ' + exitCode);
    process.exit(exitCode);
  });
});

gulp.task('server', function() {
  var app = connect()
    .use(connect.static('ui/app'))
    .use('/v1', proxy(url.parse('http://' + options.mlHost + ':' + options.mlPort + '/v1')));
  http.createServer(app).listen(options.appPort, 'localhost');
});

// Default Task
gulp.task('default', ['jshint', 'less', 'scripts', 'watch']);
