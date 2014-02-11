(function () {
  'use strict';

  angular.module('demoCat')
    .provider('MLRest', function() {

      this.$get = function($q, $http) {
        var service = {
          search: function() {

          },
          getDocument: function(uri) {

          },
          createDocument: function(doc, options) {
            // send a POST request to /v1/documents
            console.log('create document');
            var d = $q.defer();
            $http.post(
              '/v1/documents',
              doc,
              {
                params: {
                  format: 'json',
                  directory: '/demos/',
                  extension: '.json'
                }
              })
              .success(function(data) {
                d.resolve(data);
              }).error(function(reason) {
                d.reject(reason);
              });
            return d.promise;
          }
        };

        return service;
      };
    });
}());
