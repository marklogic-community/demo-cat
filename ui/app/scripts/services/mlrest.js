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

      function SearchContext(options, $q, $http) {
        options = options || {};

        var facetSelections = {};
        var textQuery = null;

        (function init(){
          options.queryOptions = options.queryOptions ? options.queryOptions : 'all';
        })();

        function runSearch() {
          var d = $q.defer();
          $http.get(
            '/v1/search',
            {
              params: {
                format: 'json',
                options: options.queryOptions,
                structuredQuery: getStructuredQuery()
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
        }

        function getStructuredQuery() {
          var structured = {
            query: {
              'and-query': {
                'queries': []
              }
            }
          };
          var facet;
          for (facet in facetSelections) {
            if (facetSelections.hasOwnProperty(facet)) {
              structured.query['and-query'].queries.push(
                {
                  'range-constraint-query': {
                    'constraint-name': facet,
                    'value': facetSelections[facet]
                  }
                }
              );
            }
          }
          if (textQuery !== null) {
            structured.query['and-query'].queries.push({
              'term-query': {
                text: textQuery
              }
            });
          }
          return structured;
        }

        return {
          selectFacet: function(facet, value) {
            if (facetSelections.facet === undefined) {
              facetSelections[facet] = [value];
            } else {
              facetSelections[facet].push(value);
            }
            return runSearch();
          },
          clearFacet: function(facet, value) {
            facetSelections[facet] = facetSelections[facet].filter( function( facetValue ) {
              return facetValue !== value;
            });
            return runSearch();
          },
          getQueryOptions: function() {
            return options.queryOptions;
          },
          getStructuredQuery: getStructuredQuery,
          search: function() {
            return runSearch();
          },
          setText: function(text) {
            if (text !== '') {
              textQuery = text;
            } else {
              textQuery = null;
            }
            return runSearch();
          }
        };
      }

      this.$get = function($q, $http) {
        var service = {
          checkLoginStatus: function() {
            var d = $q.defer();
            $http.get('/v1/resources/user-status', {})
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
          login: function(username, password) {
            var d = $q.defer();
            $http.get(
              '/v1/resources/user-login',
              {
                params: {
                  'rs:username': username,
                  'rs:password': password
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
          logout: function() {
            var d = $q.defer();
            $http.get(
              '/v1/resources/user-logout',
              {})
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
          createSearchContext: function(options) {
            return new SearchContext(options, $q, $http);
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
                params: options
              })
              .success(function(data, status, headers, config) {
                d.resolve(headers('location'));
              }).error(function(reason) {
                d.reject(reason);
              });
            return d.promise;
          },
          updateDocument: function(doc, options) {
            // send a PUT request to /v1/documents
            var d = $q.defer();
            $http.put(
              '/v1/documents',
              doc,
              {
                params: options
              })
              .success(function(data, status, headers, config) {
                d.resolve(headers('location'));
              }).error(function(reason) {
                d.reject(reason);
              });
            return d.promise;
          },
          patch: function(uri, patch) {
            var d = $q.defer();
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
            )
            .success(function(data, status, headers, config) {
              d.resolve(headers('location'));
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
