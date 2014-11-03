/*
 * Script to run from forever to start the server
 */

/* global console */
/* global process */
/* global require */
(function () {
  'use strict';
  
  console.log('Starting node server..');
  
  var args = {};
  process.argv.forEach(function(arg, index, array) {
    //console.log('argv['+index+']=' + arg);
    if (arg.match(/^--([^=]+)=(.*)$/)) {
      var key = arg.replace(/^--([^=]+)=(.*)$/, '$1');
      var val = arg.replace(/^--([^=]+)=(.*)$/, '$2');
      args[key] = val;
      //console.log(key + '=' + val);
    }
  });

  var options = {
    serverScript: args['server-script'] || './server.js',
    appPort: args['app-port'] || 9040,
    mlHost: args['ml-host'] || 'localhost',
    mlPort: args['ml-port'] || 8040
  };
  
  console.log('server-script: ' + options.serverScript);
  console.log('app-port:      ' + options.appPort);
  console.log('ml-host:       ' + options.mlHost);
  console.log('ml-port:       ' + options.mlPort);

  var server = require(options.serverScript).buildExpress(options);
  server.listen(options.appPort);

})();