(function () {
  'use strict';

  angular.module('demoCat')
    .controller('MainCtrl', ['$scope', 'MLRest', function ($scope, mlRest) {
      var model = {
        // your model stuff here
        selected: []
      };

      var searchContext = mlRest.createSearchContext();

      function updateSearchResults(data) {
        model.search = data;
      }

      mlRest.search(searchContext).then(updateSearchResults);

      angular.extend($scope, {
        model: model,
        selectFacet: function(facet, value) {
          var existing = model.selected.filter( function( selectedFacet ) {
            return selectedFacet.facet === facet && selectedFacet.value === value;
          });
          if ( existing.length === 0 ) {
            model.selected.push({facet: facet, value: value});
            mlRest.selectFacet(searchContext, facet, value).then(updateSearchResults);
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
          mlRest.clearFacet(searchContext, facet, value).then(updateSearchResults);
        }
      });
    }]);
}());
