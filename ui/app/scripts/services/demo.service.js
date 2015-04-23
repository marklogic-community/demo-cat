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
      var createParams = angular.extend({directory: '/demos/', extension: '.json'}, params);
      return upload(demo, file, '/demo/create?' + $.param(createParams));
    }

    function saveDemo(demo, file, docUri) {
      var updateParams = angular.extend({uri: docUri}, params);
      return upload(demo, file, '/demo/update?' + $.param(updateParams));
    }

    function suggestDemo(demoSearchText) {
      var updateParams = angular.extend({uri: docUri}, params);
      return $http.post('v1/values/name-uri', {
        query: {
          'queries': [{
            'word-query': {
              'element': {
                'name': 'name',
                'ns': ''
              },
              'text': [demoSearchText + '*'],
              'term-option': ['wildcarded', 'case-insensitive']
            }
          }]
        }
      }, { params: {options: 'all'}}).then(function(response){
        var demos = [];
        angular.forEach(response.data['values-response'].tuple, function(){
          var values = value['distinct-value'];
          demos.push({
            name: values[0]._value,
            uri: values[1]._value
          });
        });
        return demos;
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
