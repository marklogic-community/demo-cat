(function () {
  'use strict';

  angular.module('demoCat')
    .service('demoService', DemoService);

  function DemoService($http, $upload) {

    var service = {
      create: createDemo,
      deleteAttachment: deleteAttachment,
      save: saveDemo
    };

    var params = {
      format: 'json'
      // [GJo] Better to rely on default permissions..
      //'perm:demo-cat-role': 'read',
      //'perm:demo-cat-registered-role': 'update',
    };

    return service;

    function createDemo(demo, file) {
      var createParams = angular.extend({directory: '/demo/', extension: '.json'}, params);
      return upload(demo, file, '/demo/create?' + $.param(createParams));
    }

    function saveDemo(demo, file, docUri) {
      var updateParams = angular.extend({uri: docUri}, params);
      return upload(demo, file, '/demo/update?' + $.param(updateParams));
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

    function deleteAttachment(demoUri, attachment) {
      return $http['delete']('/demo/attachment',{params: {demoUri: demoUri, uri: attachment.uri}});
    }
  }
}());
