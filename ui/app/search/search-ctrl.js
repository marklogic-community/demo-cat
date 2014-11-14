(function () {
  'use strict';

  angular.module('demoCat.search')
    .controller('SearchCtrl', ['$scope', '$location', 'User', 'MLSearchFactory', 'MLRemoteInputService', function ($scope, $location, user, searchFactory, remoteInput) {
      var mlSearch = searchFactory.newContext(),
          model = {
            page: 1,
            qtext: '',
            search: {},
            user: user,
            selected: []
          };

      mlSearch.getFacetParams = function() {
        var self = mlSearch,
            facetQuery = self.getFacetQuery(),
            queries = [],
            facets = [];

        queries = ( facetQuery['or-query'] || facetQuery['and-query'] ).queries;

        _.each(queries, function(query) {
          var constraint = query[ _.keys(query)[0] ],
              name = constraint['constraint-name'];

          _.each( constraint.value || constraint.uri, function(value) {
            // quote values with spaces
            if (/\s+/.test(value) && !/^"(.+)"$/.test(value)) {
              value = '"' + value + '"';
            }
            facets.push( name + self.options.params.separator + value );
          });
        });

        return facets;
      };

      mlSearch.selectFacet = function(name, value, type) {
        var self = mlSearch;
        if (/^"(.*)"$/.test(value)) {
          value = value.replace(/^"(.*)"$/, '$1');
        }
        var active = self.activeFacets[name];

        if ( active && !_.contains(active.values, value) ) {
          active.values.push(value);
        } else {
          self.activeFacets[name] = { type: type, values: [value] };
        }

        return self;
      };

      (function init() {
        // wire up remote input subscription
        remoteInput.initCtrl($scope, model, mlSearch, search);

        // run a search when the user logs in
        $scope.$watch('model.user.authenticated', function() {
          search();
        });

        // capture initial URL params in mlSearch and ctrl model
        mlSearch.fromParams().then(function() {
          // if there was remote input, capture it instead of param
          if (model.qtext && model.qtext.length)  {
            mlSearch.setText(model.qtext);
          }
          updateSearchResults({});
        });

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
        if ( !model.user.authenticated ) {
          model.search = {};
          return;
        }

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
