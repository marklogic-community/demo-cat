(function () {
  'use strict';

  angular.module('demoCat.search')
    .factory('SearchModel', ['MLSearchFactory', function(searchFactory) {
      var mlSearch = searchFactory.newContext();
      return {
        page: 1,
        qtext: '',
        search: {},
        user: null,
        selected: [],
        mlSearch: mlSearch
      };
    }])
    .controller('SearchCtrl', ['$scope', 'SearchModel', '$location', 'MLRemoteInputService', function ($scope, model, $location, remoteInput) {
      var mlSearch = model.mlSearch;

      (function init() {
        model.qtext = model.qtext || '';
        
        // wire up remote input subscription
        remoteInput.initCtrl($scope, model, mlSearch, search);

        if (!model.search.results) {
          // capture initial URL params in mlSearch and ctrl model
          mlSearch.fromParams().then(function() {
            // if there was remote input, capture it instead of param
            if (model.qtext && model.qtext.length)  {
              mlSearch.setText(model.qtext);
            }
            updateSearchResults({});
          });
        }

        // capture URL params (forward/back, etc.)
        $scope.$on('$locationChangeSuccess', function(e, newUrl, oldUrl){
          if (newUrl !== oldUrl) {
            mlSearch.locationChange( newUrl, oldUrl ).then(function() {
              mlSearch
                .search()
                .then(updateSearchResults);
            });
          }
        });

        search();
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

      function search(qtext) {
        if ( arguments.length ) {
          model.qtext = qtext;
        }

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
        }
      });

    }]);
}());
