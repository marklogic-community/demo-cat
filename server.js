/*jshint node: true */

var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var http = require('http');
var path = require('path');
var ui = path.join(__dirname, 'ui/app');

function getAuth(options, session) {
  'use strict';

  if (session.user !== undefined && session.user.name !== undefined) {
    return session.user.name + ':' + session.user.password;
  } else {
    return options.defaultUser + ':' + options.defaultPass;
  }
}

exports.buildExpress = function(options) {
  'use strict';

  var express = require('express');
  var app = express();

  app.use(cookieParser());
  app.use(expressSession({
    secret: '1234567890QWERTY',
    saveUninitialized: true,
    resave: true
  }));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true
  }));

  app.set('views', ui);
  app.set('view engine', 'ejs');

  function proxy(req, res) {
    var queryString = req.originalUrl.split('?')[1];
    console.log(req.method + ' ' + req.path + ' proxied to ' + options.mlHost + ':' + options.mlPort + req.path + (queryString ? '?' + queryString : ''));
    var mlReq = http.request({
      hostname: options.mlHost,
      port: options.mlPort,
      method: req.method,
      path: req.path + (queryString ? '?' + queryString : ''),
      headers: req.headers,
      auth: getAuth(options, req.session)
    }, function(response) {
      res.status(response.statusCode);
      response.on('data', function(chunk) {
        res.write(chunk);
      });
      response.on('end', function() {
        res.end();
      });
    });

    if (req.body !== undefined) {
      mlReq.write(JSON.stringify(req.body));
      mlReq.end();
    }

    mlReq.on('error', function(e) {
      console.log('Problem with request: ' + e.message);
    });
  }

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
        res.status(401);
        res.send('Unauthenticated');
      } else if (response.statusCode === 404) {
        // authentication successful, but no profile defined
        req.session.user = {
          name: req.query.username,
          password: req.query.password
        };
        res.status(200).send({
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
              res.status(200).send({
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

  app.post('/demo/create', function(req, res) {
    var queryString = req.originalUrl.split('?')[1];
    var mlReq = http.request({
      hostname: options.mlHost,
      port: options.mlPort,
      method: 'POST',
      path: '/v1/documents?' + queryString,
      headers: req.headers,
      auth: getAuth(options, req.session)
    }, function(response) {
      res.status(response.statusCode);
      if (response.statusCode >= 400) {
        console.log('creation of demo failed!');
      } else {
        console.log('created demo at: ' + response.headers.location);
        res.write(JSON.stringify({uri: response.headers.location.replace(/(.*\?uri=)/, '')}));
      }
      response.on('data', function(chunk) {
        res.write(chunk);
      });
      response.on('end', function() {
        res.end();
      });
    });

    if (req.body !== undefined) {
      mlReq.write(JSON.stringify(req.body));
      mlReq.end();
    }

    mlReq.on('error', function(e) {
      console.log('Problem with request: ' + e.message);
    });

  });

  app.get('/v1*', function(req, res){
    if (req.session.user === undefined) {
      res.status(401).send('Unauthorized');
    } else {
      proxy(req, res);
    }
  });

  app.put('/v1*', function(req, res){
    var user = req.session.user;
    var escapedUserName = (user && user.name) ? user.name.replace(/([\(\)[{*+.$^\\|?\-])/g, '\\$1') : '';
    if (user === undefined) {
      res.status(401).send('Unauthorized');
    } else if (req.path === '/v1/documents' &&
      req.query.uri.match('/users/') &&
      req.query.uri.match(new RegExp('/users/[^(' + escapedUserName + ')]+.json'))) {
      // The user is try to PUT to a profile document other than his/her own. Not allowed.
      res.status(403).send('Forbidden');
    } else {
      if (req.path === '/v1/documents' && req.query.uri.match('/users/')) {
        // TODO: The user is updating the profile. Update the session info.
      }
      proxy(req, res);
    }
  });

  app.post('/v1*', function(req, res){
    if (req.session.user === undefined) {
      res.status(401).send('Unauthorized');
    } else {
      proxy(req, res);
    }
  });

  // Redirect all other traffic to Angular
  app.use(express.static(__dirname + '/ui/app', { maxAge: 30000 }));
  app.use('/*', function(req, res){
    res.render('index');
  });

  return app;
};
