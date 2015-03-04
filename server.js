/*jshint node: true */
'use strict';
var _ = require('underscore');
var bodyParser = require('body-parser');
var multer  = require('multer');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var fs = require('fs');
var http = require('http');
var path = require('path');
var q = require('q');
var ui = path.join(__dirname, 'ui/app');

function getAuth(options, session) {

  if (session.user !== undefined && session.user.name !== undefined) {
    return session.user.name + ':' + session.user.password;
  } else {
    return options.defaultUser + ':' + options.defaultPass;
  }
}

exports.buildExpress = function(options) {

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

  function submitDocument(req, doc, queryParams, fileMeta) {
    fileMeta = fileMeta || {};
    var d = q.defer();
    var queryParts = [];
    for (var key in queryParams) {
      if (queryParams.hasOwnProperty(key) && queryParams[key]) {
        queryParts.push(key+'='+queryParams[key]);
      }
    }
    var queryString = queryParts.join('&');
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
      if (response.statusCode >= 400) {
        d.reject({status: response.statusCode});
        console.log('creation of file failed!');
      } else {
        console.log('created file at: ' + response.headers.location);
        fileMeta.uri = response.headers.location.replace(/(.*\?uri=)/, '');
        d.resolve(fileMeta);
      }
    });

    if (req.body !== undefined) {
      mlReq.write(doc);
      mlReq.end();
    }

    mlReq.on('error', function(e) {
      d.reject(e.message);
      console.log('Problem with request: ' + e.message);
    });
    return d.promise;
  }

  function updateDocument(req, doc, queryParams) {
    var d = q.defer();
    var queryParts = [];
    for (var key in queryParams) {
      if (queryParams.hasOwnProperty(key) && queryParams[key]) {
        queryParts.push(key+'='+queryParams[key]);
      }
    }
    var queryString = queryParts.join('&');
    var params = {
      hostname: options.mlHost,
      port: options.mlPort,
      method: 'PUT',
      path: '/v1/documents?' + queryString,
      headers: {'content-type': 'application/json;charset=UTF-8'},
      auth: getAuth(options, req.session)
    };
    var mlReq = http.request(params, function(response) {
      if (response.statusCode >= 400) {
        d.reject({status: response.statusCode});
        console.log('update of file failed!');
      } else {
        console.log('updated file at: ' + queryParams.uri);
        var fileMeta = { uri: queryParams.uri };
        d.resolve(fileMeta);
      }
    });

    if (doc !== undefined) {
      mlReq.write(JSON.stringify(doc, replacer));
    }
    mlReq.end();

    mlReq.on('error', function(e) {
      d.reject(e.message);
      console.log('Problem with request: ' + e.message);
    });
    return d.promise;
  }

  function getDemo(req, uri) {
    console.log('getting demo ' + uri);
    var d = q.defer();
    var params = {
      hostname: options.mlHost,
      port: options.mlPort,
      method: 'GET',
      path: '/v1/documents?uri=' + uri + '&format=json',
      auth: getAuth(options, req.session)
    };
    var mlReq = http.request(params, function(response) {
      if (response.statusCode >= 400) {
        d.reject({status: response.statusCode});
        console.log('failed to retrieve demo');
      } else {
        var chunks = [];
        response.on('data', function(chunk){
          chunks.push(chunk);
        });
        response.on('end', function(){
          d.resolve(JSON.parse(chunks.join('')));
        });
      }
    });

    mlReq.on('error', function(e) {
      d.reject(e.message);
      console.log('Problem with request: ' + e.message);
    });
    mlReq.end();
    return d.promise;
  }

  function submitAttachments(req) {
    var promises = [];
    var files = Array.isArray(req.files.file) ? req.files.file : [req.files.file];

    files.forEach(function(file) {
      if (file && file.path) {
        var d = q.defer();
        var extension = file.path.replace(/^.*(\.[^\.]+)$/, '$1');
        fs.readFile(path.join(__dirname, file.path), function (err,data) {
          if (err) {
            console.log(err);
          }
          d.resolve(
            submitDocument(
              req,
              data,
              {
                directory: '/demo-attachments/',
                extension: extension
              },
              {
                attachmentName: (file.originalname || file.name)
              }
            )
          );
          fs.unlink(file.path);
        });
        promises.push(d.promise);
      }
    });

    return q.all(promises).then(q.all);
  }

  app.get('/demo/attachment', function(req, res) {
    var params = {
      hostname: options.mlHost,
      port: options.mlPort,
      method: 'GET',
      path: '/v1/documents?uri=' + req.query.uri + '&format=binary',
      headers: req.headers,
      auth: getAuth(options, req.session)
    };
    delete params.headers['content-length'];
    var mlReq = http.request(params, function(response) {
      if (response.statusCode >= 400) {
        res.status(response.statusCode).send('Error!');
      } else {
        res.headers = response.headers;
        if (req.query.download) {
          var filename;
          if (req.query.filename) {
            filename = req.query.filename;
          } else {
            filename = req.query.uri.replace(/^.*\/([^\/]+)$/,'$1');
          }
          res.header('Content-Disposition', 'attachment;filename=' + filename );
        }
        response.on('data', function(chunk){
          res.write(chunk);
        });
        response.on('end', function(){
          res.end();
        });
      }
    });

    mlReq.on('error', function(e) {
      res.status(500).send(e.message);
      console.log('Problem with request: ' + e.message);
    });
    mlReq.end();
  });

  app.delete('/demo/attachment', function(req, res) {
    console.log('starting to delete attachment');
    var rejectFunction = function(step) {
      return function(rejectionMessage) {
        res.status(500).send(step + ': ' + rejectionMessage);
      };
    };
    getDemo(req, req.query.demoUri).then(function(demo) {
      var attachments = _.filter(demo.attachments, function(attachment){ return attachment.uri !== req.query.uri; });
      demo.attachments = attachments;
      updateDocument(req, demo, {uri: req.query.demoUri, format: 'json'}).then(function(){
        var params = {
          hostname: options.mlHost,
          port: options.mlPort,
          method: 'DELETE',
          path: '/v1/documents?uri=' + req.query.uri,
          headers: req.headers,
          auth: getAuth(options, req.session)
        };
        delete params.headers['content-length'];
        var mlReq = http.request(params, function(response) {
          console.log('delete attachment file');
          if (response.statusCode >= 400) {
            res.status(response.statusCode).send('Error!');
            console.log('deletion of file failed!');
          } else {
            res.headers = response.headers;
            response.on('data', function(chunk){
              res.write(chunk);
            });
            response.on('end', function(){
              res.end();
            });
          }
        });
        mlReq.on('error', function(e) {
          res.status(500).send(e.message);
          console.log('Problem with request: ' + e.message);
        });
        mlReq.end();
      },
      rejectFunction('updateDemo'));
    },
    rejectFunction('getDemo'));
  });

  app.post('/demo/create', isWriter, function(req, res) {
    var demo = _.extend({},req.body);
    var attachments = [];
    submitAttachments(req).then( function(resolved) {
      resolved.forEach(function(fileMeta) {
        if (fileMeta && fileMeta.uri) {
          attachments.push(fileMeta);
        }
      });
      attachments.concat(demo.attachments);
      submitDocument(
        req,
        JSON.stringify(demo, replacer),
        req.query
      ).then(
        function(mlRes) {
          res.send(JSON.stringify(mlRes));
        },
        function(mlRes) {
          res.status(mlRes.status || 500).send();
        }
      );
    });
  });

  app.post('/demo/update', isWriter, function(req, res) {
    var demo = _.extend({},req.body);
    var attachments = [];
    submitAttachments(req).then(function(resolved) {
      resolved.forEach(function(fileMeta) {
        if (fileMeta && fileMeta.uri) {
          attachments.push(fileMeta);
        }
      });
      attachments.concat(demo.attachments);
      demo.attachments = attachments;
      var queryString = req.originalUrl.split('?')[1];
      var params = {
        hostname: options.mlHost,
        port: options.mlPort,
        method: 'PUT',
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
          console.log('update of demo failed!');
          res.send('Error!');
        } else {
          console.log('update demo at: ' + req.query.uri);
          res.send(JSON.stringify({uri: req.query.uri}));
        }
      });

      if (demo !== undefined) {
        mlReq.write(JSON.stringify(demo, replacer));
        mlReq.end();
      }

      mlReq.on('error', function(e) {
        console.log('Problem with request: ' + e.message);
      });
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

  app.get('/edit/demos/*', function(req, res, next) {
    if (!determineIfHasType(req.session.user, 'writer')) {
      res.status(404).send('Not Found');
    }
    else {
      next();
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
