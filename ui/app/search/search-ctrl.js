(function () {
  'use strict';

  angular.module('demoCat.search')
    .factory('SearchModel', ['MLSearchFactory', function(searchFactory) {
      var mlSearch = searchFactory.newContext({ pageLength: 12 });
      return {
        page: 1,
        qtext: '',
        search: {},
        user: null,
        selected: [],
        mlSearch: mlSearch,
        quick: null
      };
    }])
    .controller('SearchCtrl', ['$scope', 'SearchModel', '$location', 'MLRemoteInputService', 'MLRest', function ($scope, model, $location, remoteInput, mlRest) {
      var mlSearch = model.mlSearch;

      (function init() {
        model.qtext = model.qtext || $location.search().q || '';

        // wire up remote input subscription
        remoteInput.initCtrl($scope, model, mlSearch, search);

        var oldParams = mlSearch.getParams();
        var newParams = mlSearch.getCurrentParams();

        // restore params, if we have cached results, and no params provided
        if (model.search.results && _.isEqual( {}, newParams )) {

          $location.search( oldParams );

        } else {

          // capture URL params in mlSearch and ctrl model
          mlSearch.fromParams().then(function() {

            // and run search if no cached results, or params changed
            if (!model.search.results || !_.isEqual( oldParams, newParams )) {
              search();
            }

          });

        }

        // capture URL params (forward/back, etc.)
        $scope.$on('$locationChangeSuccess', function(e, newUrl, oldUrl){
          if (newUrl !== oldUrl) {
            mlSearch.locationChange( newUrl, oldUrl ).then(function() {
              search();
            });
          }
        });

        if (!model.quick) {
          mlRest.getDocument('/config/quick-filter.json', { format: 'json' }).then(function(response) {
            model.quick = response.data.quickFilter;
          });
        }
      })();

      function updateSearchResults(data) {
        model.search = data;
        model.qtext = mlSearch.getText();
        model.page = mlSearch.getPage();
        if (model.qtext && model.qtext.length)  {
          remoteInput.setInput( model.qtext );
        }
        $location.search( mlSearch.getParams() );
      }

      function addQuery() {
        // as documented in https://docs.marklogic.com/guide/search-dev/structured-query#id_59265
        var combinedQuery = {'and-query': {'queries': []}};
        mlSearch.clearAdditionalQueries();
        model.quick.forEach(function(entry) {
          if (entry.checked) {
            if (entry.query) {
              combinedQuery['and-query'].queries.push(entry.query);
            } else if (entry.equery) {
              combinedQuery['and-query'].queries.push(eval('(' + entry.equery + ')'));
            }
          }
        });
        mlSearch.addAdditionalQuery(combinedQuery);
        search();
      }

      function search(qtext) {
        if ( arguments.length ) {
          model.qtext = qtext;
        }

        model.page = model.page || mlSearch.getPage();

        mlSearch
          .setText(model.qtext)
          .setPage(model.page)
          .search()
          .then(updateSearchResults);
      }

      angular.extend($scope, {
        model: model,
        search: search,
        toggleFacet: function toggleFacet(facetName, value) {
          mlSearch
            .toggleFacet( facetName, value )
            .search()
            .then(updateSearchResults);
        },
        selectFacet: function(facet, value) {
          var existing = model.selected.filter( function( selectedFacet ) {
            return selectedFacet.facet === facet && selectedFacet.value === value;
          });
          if ( existing.length === 0 ) {
            model.selected.push({facet: facet, value: value});
            mlSearch
              .setPage(1)
              .selectFacet(facet, value.replace(/^"(.*)"$/,'$1'))
              .search()
              .then(updateSearchResults);
          }
        },
        clearFacet: function(facet, value) {
          var i;
          for (i = 0; i < model.selected.length; i++) {
            if (model.selected[i].facet === facet && model.selected[i].value === value) {
              model.selected.splice(i, 1);
              break;
            }
          }
          mlSearch
            .clearFacet(facet, value.replace(/^"(.*)"$/,'$1'))
            .setPage(1)
            .search()
            .then(updateSearchResults);
        },
        addQuery: addQuery
      });

    }]);
}());
