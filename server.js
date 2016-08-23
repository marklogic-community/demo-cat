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
    resave: false
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
      return JSON.parse('{ "json":' + value + '}').json;
    }
    return value;
  }

  function clearLdapCache(req) {
    /* GJo: not working as expected. Instead we will use unlimited cache timeout..
    var mlReq = http.request({
      hostname: options.mlHost,
      port: options.mlPort,
      method: 'DELETE',
      path: '/v1/resources/ldap-cache',
      auth: getAuth(options, req.session)
    });

    mlReq.on('error', function(e) {
      console.log('Problem with request: ' + e.message);
    });

    mlReq.end();
    */
  }

  function proxy(req, res) {
    clearLdapCache(req);
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
      // [GJo] (#67) forward all headers from MarkLogic
      for (var header in response.headers) {
        res.header(header, response.headers[header]);
      }

      response.on('data', function(chunk) {
        res.write(chunk);
      });
      response.on('end', function() {
        res.end();
      });
    });

    req.pipe(mlReq);
    req.on('end', function() {
      mlReq.end();
    });

    mlReq.on('error', function(e) {
      res.status(500).send("Internal Server Error");
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
    clearLdapCache(req);
    var login = http.request({
      method: 'POST',
      hostname: options.mlHost,
      port: options.mlPort,
      //path: '/v1/documents?uri=/users/' + req.query.username + '.json',
      path: '/v1/resources/profile',
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
          //console.log('chunk: ' + chunk);
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
            username: req.session.user.name,
            profile: req.session.user.profile
          });
        });
      }
    });

    login.end();

    login.on('socket', function (socket) {
      socket.setTimeout(10000);
      socket.on('timeout', function() {
        console.log('timeout..');
        login.abort();
      });
    });

    login.on('error', function(e) {
      console.log('login failed: ' + e);
      login.abort();
      res.status(500).send('Login failed');
    });
  }

  app.get('/user/status', function(req, res) {
    if (req.session.user === undefined) {
      res.status(401).send('Unauthenticated');
    } else {
      getUserStatus(req, res, req.session.user.name, req.session.user.password);
    }
  });

  app.post('/user/login', function(req, res) {
    // or maybe we can try to read the profile and distinguish between 401 and 404
    // 404 - valid credentials, but no profile yet
    // 401 - bad credentials
    getUserStatus(req, res, req.body.username, req.body.password);
  });

  app.post('/user/logout', function(req, res) {
    delete req.session.user;
    res.send();
  });

  function submitDocument(req, doc, queryParams, fileMeta) {
    clearLdapCache(req);
    fileMeta = fileMeta || {};
    var mimeType = fileMeta.mimeType || 'application/json;charset=UTF-8';
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
    params.headers['content-type'] = mimeType;
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
    clearLdapCache(req);
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
    clearLdapCache(req);
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
    clearLdapCache(req);
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
              { directory: '/demo-attachments/',
                extension: extension },
              { attachmentName: (file.originalname || file.name),
                mimeType: file.mimetype,
                size: file.size }
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
    if (req.session.user === undefined) {
      res.status(401).send('Unauthorized');
    } else {
      clearLdapCache(req);
      var params = {
        hostname: options.mlHost,
        port: options.mlPort,
        method: 'GET',
        path: '/v1/documents?uri=' + req.query.uri + '&format=binary&transform=stream',
        headers: req.headers,
        auth: getAuth(options, req.session)
      };
      var mlReq = http.request(params, function(response) {
        if (response.statusCode >= 400) {
          res.status(response.statusCode).send('Error!');
        } else {
          res.headers = response.headers;
          res.header('content-type', response.headers['content-type']);
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
    }
  });

  app.delete('/demo/attachment', function(req, res) {
    if (req.session.user === undefined) {
      res.status(401).send('Unauthorized');
    } else {
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
    }
  });

  app.post('/demo/create', isWriter, function(req, res) {
    if (req.session.user === undefined) {
      res.status(401).send('Unauthorized');
    } else {
      var demo = _.extend({},req.body.data ? JSON.parse(req.body.data) : req.body);
      var attachments = [];
      submitAttachments(req).then( function(resolved) {
        resolved.forEach(function(fileMeta) {
          if (fileMeta && fileMeta.uri) {
            attachments.push(fileMeta);
          }
        });
        demo.attachments = _.flatten([demo.attachments,attachments]);
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
    }
  });

  app.post('/demo/update', isWriter, function(req, res) {
    if (req.session.user === undefined) {
      res.status(401).send('Unauthorized');
    } else {
      var demo = _.extend({},req.body.data ? JSON.parse(req.body.data) : req.body);
      var attachments = [];
      submitAttachments(req).then(function(resolved) {
        clearLdapCache(req);
        resolved.forEach(function(fileMeta) {
          if (fileMeta && fileMeta.uri) {
            attachments.push(fileMeta);
          }
        });
        demo.attachments = _.flatten([demo.attachments,attachments]);
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
        }
        mlReq.end();
        mlReq.on('error', function(e) {
          console.log('Problem with request: ' + e.message);
        });
      });
    }
  });

  app.delete('/demo/delete', isWriter, function(req, res) {
    if (req.session.user === undefined) {
      res.status(401).send('Unauthorized');
    } else {
      clearLdapCache(req);
      var queryString = req.originalUrl.split('?')[1];
      var params = {
        hostname: options.mlHost,
        port: options.mlPort,
        method: 'DELETE',
        path: '/v1/documents?' + queryString,
        headers: req.headers,
        auth: getAuth(options, req.session)
      };
      var mlReq = http.request(params, function(response) {
        res.status(response.statusCode);
        if (response.statusCode >= 400) {
          console.log('delete of demo failed!');
          res.send('Error!');
        } else {
          console.log('deleted demo at: ' + req.query.uri);
          res.send(JSON.stringify({uri: req.query.uri}));
        }
      });
      mlReq.end();
      mlReq.on('error', function(e) {
        console.log('Problem with request: ' + e.message);
      });
    }
  });

  app.get('/v1*', function(req, res){
    if (req.session.user === undefined) {
      res.status(401).send('Unauthorized');
    } else {
      proxy(req, res);
    }
  });

  app.put('/v1/resources/profile', function(req, res){
    if (req.session.user === undefined) {
      res.status(401).send('Unauthorized');
    } else {
      proxy(req, res);
    }
  });

  app.put('/v1*', isWriter, function(req, res){
    var user = req.session.user;
    if (user === undefined) {
      res.status(401).send('Unauthorized');
    } else if (req.path === '/v1/documents' && req.query.uri.match('/users/')) {
      // The user is try to PUT to a profile document other than his/her own. Not allowed.
      res.status(403).send('Forbidden');
    } else {
      proxy(req, res);
    }
  });

  app.get('/edit/demos/*', function(req, res, next) {
    if (req.session.user === undefined) {
      console.log('redirecting to /login?url=' + encodeURIComponent(req.originalUrl));
      res.redirect('/login?url=' + encodeURIComponent(req.originalUrl));
    } else if (!determineIfHasType(req.session.user, 'writer')) {
      res.status(404).send('Not Found');
    }
    else {
      next();
    }
  });

  app.post('/v1/resources/file-bug', function(req, res){
    if (req.session.user === undefined) {
      res.status(401).send('Unauthorized');
    } else {
      proxy(req, res);
    }
  });

  app.post('/v1/resources/comment', function(req, res){
    if (req.session.user === undefined) {
      res.status(401).send('Unauthorized');
    } else {
      proxy(req, res);
    }
  });

  app.post('/v1/resources/follow', function(req, res){
    if (req.session.user === undefined) {
      res.status(401).send('Unauthorized');
    } else {
      proxy(req, res);
    }
  });

  app.post('/v1*', isWriter, function(req, res){
    if (req.session.user === undefined) {
      res.status(401).send('Unauthorized');
    } else {
      proxy(req, res);
    }
  });

  app.delete('/v1/resources/follow', function(req, res){
    if (req.session.user === undefined) {
      res.status(401).send('Unauthorized');
    } else {
      proxy(req, res);
    }
  });

  app.delete('/v1/resources/comment', function(req, res){
    if (req.session.user === undefined) {
      res.status(401).send('Unauthorized');
    } else {
      proxy(req, res);
    }
  });

  app.delete('/v1/resources/*', isWriter, function(req, res){
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
