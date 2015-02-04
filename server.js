/*jshint node: true */

var bodyParser = require('body-parser');
var multer  = require('multer');
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
  app.use(multer({dest: './uploads/', includeEmptyFields: false}));

  app.set('views', ui);
  app.set('view engine', 'ejs');

  var jsonPattern = /^\[[^\]]*\]$/;

  function replacer(key, value) {
    if (typeof value === 'string' && jsonPattern.test(value)) {
      return eval(value);
    }
    return value;
  }

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

  // function isAdmin(req, res, next) {
  //   return _isType('admin', req, res, next);
  // }

  function isWriter(req, res, next) {
    return _isType('writer', req, res, next);
  }

  function _isType(type, req, res, next) {
    if (!determineIfHasType(req.session.user, type)) {
      res.status(403).send('Forbidden');
    } else {
      return next();
    }
  }

  function determineIfHasType(user, type) {
    if (!(user && user.profile && user.profile.webroles)) {
      return false;
    }
    return user.profile.webroles.indexOf(type) > -1;
  }

  function getUserStatus(req, res, username, password) {
    var login = http.get({
      hostname: options.mlHost,
      port: options.mlPort,
      //path: '/v1/documents?uri=/users/' + req.query.username + '.json',
      path: '/v1/resources/profile',
      headers: req.headers,
      auth: username + ':' + password
    }, function(response) {
      if (response.statusCode === 401) {
        res.status(401).send('Unauthenticated');
      } else {
        // authentication successful, remember the username
        req.session.user = {
          name: username,
          password: password
        };
        response.on('data', function(chunk) {
          console.log('chunk: ' + chunk);
          var json = JSON.parse(chunk);
          req.session.user.profile = {};

          if (json.user !== undefined) {
            req.session.user.profile.fullname = json.user.fullname;
            req.session.user.profile.emails = json.user.emails;
            req.session.user.profile.follows = json.user.follows;
          }
          req.session.user.profile.webroles = json.webroles;

          res.status(200).send({
            authenticated: true,
            username: req.query.username,
            profile: req.session.user.profile
          });
        });
      }
    });

    login.on('error', function(e) {
      console.log('login failed: ' + e.statusCode);
    });
  }

  app.get('/user/status', function(req, res) {
    if (req.session.user === undefined) {
      res.status(401);
      res.send('Unauthenticated');
    } else {
      getUserStatus(req, res, req.session.user.name, req.session.user.password);
    }
  });

  app.get('/user/login', function(req, res) {
    // or maybe we can try to read the profile and distinguish between 401 and 404
    // 404 - valid credentials, but no profile yet
    // 401 - bad credentials
    getUserStatus(req, res, req.query.username, req.query.password);
  });

  app.get('/user/logout', function(req, res) {
    delete req.session.user;
    res.send();
  });

  app.post('/demo/create', isWriter, function(req, res) {
    var queryString = req.originalUrl.split('?')[1];
    var params = {
      hostname: options.mlHost,
      port: options.mlPort,
      method: 'POST',
      path: '/v1/documents?' + queryString,
      headers: req.headers,
      auth: getAuth(options, req.session)
    };
    delete params.headers['content-length'];
    params.headers['content-type'] = 'application/json;charset=UTF-8';
    //delete params.headers['content-type'];
    var mlReq = http.request(params, function(response) {
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
      mlReq.write(JSON.stringify(req.body, replacer));
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

  app.put('/v1*', isWriter, function(req, res){
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

  app.get('/edit/demos/*', function(req, res) {
    if (!determineIfHasType(req.session.user, 'writer')) {
      res.status(404).send('Not Found');
    }
    else {
      res.next();
    }
  });

  app.post('/v1*', isWriter, function(req, res){
    if (req.session.user === undefined) {
      res.status(401).send('Unauthorized');
    } else {
      proxy(req, res);
    }
  });

  app.delete('/v1/resources/follow*', function(req, res){
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
