(function () {
  'use strict';

  angular.module('demoCat')
    .controller('MainCtrl', ['$scope', 'MLJS', function ($scope, mljs) {
      var model = {
        // your model stuff here
        selected: []
      };

      var searchContext = mljs.getSearchContext();

      function updateSearchResults(data) {
        model.search = data;
      }

      var results = mljs.search().then(updateSearchResults);

      angular.extend($scope, {
        model: model,
        selectFacet: function(facet, value) {
          var existing = model.selected.filter( function( selectedFacet ) {
            return selectedFacet.facet === facet && selectedFacet.value === value;
          });
          if ( existing.length === 0 ) {
            console.log('selected facet ' + facet + ' with value ' + value);
            model.selected.push({facet: facet, value: value});
            mljs.selectFacet(searchContext, facet, value).then(updateSearchResults);  
          }
        },
        clearFacet: function(facet, value) {
          var i;
          console.log('clearing facet ' + facet + ' with value ' + value);
          for (i = 0; i < model.selected.length; i++) {
            if (model.selected[i].facet === facet && model.selected[i].value === value) {
              model.selected.splice(i, 1);
              break;
            }
          }
          mljs.clearFacet(searchContext, facet, value).then(updateSearchResults);
        }
      });
    }]);
}());
