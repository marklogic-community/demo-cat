(function () {
  'use strict';

  angular.module('demoCat')
    .service('demoService', DemoService);

  function DemoService($http) {

    var service = {
      create: createDemo,
      save: saveDemo
    };

    return service;

    function createDemo(demo) {
      var params = {
        format: 'json',
        // [GJo] Better to rely on default permissions..
        //'perm:demo-cat-role': 'read',
        //'perm:demo-cat-registered-role': 'update',
        directory: '/demos/',
        extension: '.json'
      };
      return $http.post('/demo/create', demo, { params: params }).then(function(resp) {
        return resp.data;
      });
    }

    function saveDemo(demo, docUri) {
                                                               // [GJo] Better to rely on default permissions..
      var uri = '/v1/documents?uri=' + docUri + '&format=json';//'&perm:demo-cat-role=read&perm:demo-cat-registered-role=update';
      return $http.put(uri, demo).then(function(resp) {
        return { uri: docUri };
      });
    }
  }
}());
