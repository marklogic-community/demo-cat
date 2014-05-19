/*jshint node: true */

'use strict';

var gulp = require('gulp');

var argv = require('yargs').argv;
var bodyParser = require('body-parser');
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
  mlPort: argv['ml-port'] || '8070',
  defaultUser: 'demo-cat-user',
  defaultPass: 'c2t2l0g'
};

function getAuth(session) {
  if (session.user !== undefined && session.user.name !== undefined) {
    return session.user.name + ':' + session.user.password;
  } else {
    return options.defaultUser + ':' + options.defaultPass;
  }
}

// start express
gulp.task('start', function () {
  var express = require('express');
  var app = express();

  app.use(cookieParser());
  app.use(expressSession({secret: '1234567890QWERTY'}));
  app.use(bodyParser());

  app.get('/v1*', function(req, res){
    var queryString = req.originalUrl.split('?')[1];
    http.get({
      hostname: options.mlHost,
      port: options.mlPort,
      path: req.path + (queryString ? '?' + queryString : ''),
      headers: req.headers,
      auth: getAuth(req.session)
    }, function(response) {
      response.on('data', function(chunk) {
        res.send(chunk);
      });
    });
  });

  app.put('/v1*', function(req, res){
    var queryString = req.originalUrl.split('?')[1];

    if (req.session.user === undefined) {
      res.send(401, 'Unauthorized');
    } else if (req.path === '/v1/documents' &&
      req.query.uri.match('/users/') &&
      req.query.uri.match(new RegExp('/users/[^(' + req.session.user.name + ')]+.json'))) {
      // The user is try to PUT to a profile document other than his/her own. Not allowed.
      res.send(403, 'Forbidden');
    } else {
      console.log('PUT ' + req.path + ' proxied to ' + options.mlHost + ':' + options.mlPort + req.path + (queryString ? '?' + queryString : ''));
      var mlReq = http.request({
        hostname: options.mlHost,
        port: options.mlPort,
        method: 'PUT',
        path: req.path + (queryString ? '?' + queryString : ''),
        headers: req.headers,
        auth: getAuth(req.session)
      }, function(response) {
        response.on('data', function(chunk) {
          res.send(chunk);
        });
        response.on('end', function() {
          res.end();
        });
      });

      mlReq.write(JSON.stringify(req.body));
      mlReq.end();

      mlReq.on('error', function(e) {
        console.log('Problem with request: ' + e.message);
      });
    }
  });

  app.get('/user/status', function(req, res) {
    if (req.session.user === undefined) {
      res.send('{"authenticated": false}');
    } else {
      res.send({
        authenticated: true,
        username: req.session.user.name,
        profile: req.session.user.profile
      });
    }
  });

  app.get('/user/login', function(req, res) {
    // or maybe we can try to read the profile and distinguish between 401 and 404
    // 404 - valid credentials, but no profile yet
    // 401 - bad credentials
    var login = http.get({
      hostname: options.mlHost,
      port: options.mlPort,
      path: '/v1/documents?uri=/users/' + req.query.username + '.json',
      headers: req.headers,
      auth: req.query.username + ':' + req.query.password
    }, function(response) {
      if (response.statusCode === 401) {
        res.statusCode = 401;
        res.send('Unauthenticated');
      } else if (response.statusCode === 404) {
        // authentication successful, but no profile defined
        req.session.user = {
          name: req.query.username,
          password: req.query.password
        };
        res.send(200, {
          authenticated: true,
          username: req.query.username
        });
      } else {
        if (response.statusCode === 200) {
          // authentication successful, remember the username
          req.session.user = {
            name: req.query.username,
            password: req.query.password
          };
          response.on('data', function(chunk) {
            var json = JSON.parse(chunk);
            if (json.user !== undefined) {
              req.session.user.profile = {
                fullname: json.user.fullname,
                emails: json.user.emails
              };
              res.send(200, {
                authenticated: true,
                username: req.query.username,
                profile: req.session.user.profile
              });
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

  app.get('/user/logout', function(req, res) {
    delete req.session.user;
    res.send();
  });

  app.use(express.static('ui/app'));
  app.use('/profile', express.static('ui/app'));
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
