(function () {
  'use strict';

  angular.module('demoCat')
    .service('demoService', DemoService);

  function DemoService($http, $upload) {

    var service = {
      create: createDemo,
      save: saveDemo
    };

    var params = {
      format: 'json',
      // [GJo] Better to rely on default permissions..
      //'perm:demo-cat-role': 'read',
      //'perm:demo-cat-registered-role': 'update',
      directory: '/demos/',
      extension: '.json'
    };

    return service;

    function createDemo(demo, file) {
      return upload(demo, file, '/demo/create?' + $.param(params));
    }

    function saveDemo(demo, file, docUri) {
      return upload(demo, file, '/demo/update?uri=' + docUri + '&' + $.param(params));
    }

    function upload(demo, file, url) {
      return $upload.upload({
          url: url,
          method: 'POST',
          file: file,
          data: demo
        }).then(function(resp) {
          return resp.data;
        });
    }

  }
}());
