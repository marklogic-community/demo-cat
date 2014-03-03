(function () {
  'use strict';

  angular.module('demoCat')
    .provider('MLRest', function() {

      // Rewrite the data.results part of the response from /v1/search so that the metadata section in each is easier
      // to work with.
      function rewriteResults(results) {
        var rewritten = [];
        var revised = {};
        var metadata, j, key, prop;

        for (var i in results) {
          if (results.hasOwnProperty(i)) {
            revised = {};
            for (prop in results[i]) {
              if (results[i].hasOwnProperty(prop)) {
                if (prop === 'metadata') {
                  metadata = {};
                  for (j in results[i].metadata) {
                    if (results[i].metadata.hasOwnProperty(j)) {
                      for (key in results[i].metadata[j]) {
                        if (results[i].metadata[j].hasOwnProperty(key)) {
                          if (metadata[key]) {
                            metadata[key].push(results[i].metadata[j][key]);
                          } else {
                            metadata[key] = [ results[i].metadata[j][key] ];
                          }
                        }
                      }
                    }
                  }
                  revised.metadata = metadata;
                } else {
                  revised[prop] = results[i][prop];
                }
              }
            }

            rewritten.push(revised);
          }
        }

        return rewritten;
      }

      this.$get = function($q, $http) {
        var service = {
          updateSearch: function(query) {


            // return search();
          },
          search: function() {
            var d = $q.defer();
            $http.get(
              '/v1/search',
              {
                params: {
                  format: 'json',
                  options: 'all'
                }
              })
            .success(
              function(data) {
                data.results = rewriteResults(data.results);
                d.resolve(data);
              })
            .error(
              function(reason) {
                d.reject(reason);
              });
            return d.promise;
          },
          getDocument: function(uri) {
            var d = $q.defer();
            $http.get(
              '/v1/documents',
              {
                params: {
                  format: 'json',
                  uri: uri
                }
              })
            .success(
              function(data) {
                d.resolve(data);
              })
            .error(
              function(reason) {
                d.reject(reason);
              });
            return d.promise;
          },
          createDocument: function(doc, options) {
            // send a POST request to /v1/documents
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
              .success(function(data, status, headers, config) {
                d.resolve(headers('location'));
              }).error(function(reason) {
                d.reject(reason);
              });
            return d.promise;
          },
          patch: function(uri, patch) {
            // var d = $q.defer();
            $http.post(
              '/v1/documents',
              patch,
              {
                params: {
                  uri: uri
                },
                headers: {
                  'X-HTTP-Method-Override': 'PATCH',
                  'Content-Type': 'application/json'
                }
              }
            );
          }
        };

        return service;
      };
    });
}());
