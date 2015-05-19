(function () {
  'use strict';

  angular.module('demoCat')
    .service('demoService', DemoService);

  function DemoService($http, $upload, MLRest) {

    var service = {
      get: getDemo,
      create: createDemo,
      delete: deleteDemo,
      deleteAttachment: deleteAttachment,
      save: saveDemo,
      list: listDemos
    };

    var params = {
      format: 'json'
      // [GJo] Better to rely on default permissions..
      //'perm:demo-cat-role': 'read',
      //'perm:demo-cat-registered-role': 'update',
    };

    return service;

    function getDemo(docUri) {
      return MLRest.getDocument(docUri, { format: 'json' }).then(function(response) {
        return response.data;
      });
    }

    function deleteDemo(docUri) {
      return $http['delete']('/demo/delete',{params: {uri: docUri}});
    }

    function createDemo(demo, file) {
      var createParams = angular.extend({directory: '/demos/', extension: '.json'}, params);
      return upload(demo, file, '/demo/create?' + $.param(createParams));
    }

    function saveDemo(demo, file, docUri) {
      var updateParams = angular.extend({uri: docUri}, params);
      return upload(demo, file, '/demo/update?' + $.param(updateParams));
    }

    function listDemos() {
      return MLRest.values('name-uri', { options: 'all', format: 'json' }).then(function(resp) {
        if (resp.data['values-response'].tuple) {
          return resp.data['values-response'].tuple.map(function(value) {
            var values = value['distinct-value'];
            return {
              name: values[0]._value,
              uri: values[1]._value
            };
          });
        }
      });
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
