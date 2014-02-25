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
          console.log('selected facet ' + facet + ' with value ' + value);
          model.selected.push({facet: facet, value: value});
          mljs.selectFacet(searchContext, facet, value).then(updateSearchResults);
        },
        clearFacet: function(facet) {
          var i;
          console.log('clearing facet ' + facet);
          for (i = 0; i < model.selected.length; i++) {
            if (model.selected[i].facet === facet) {
              model.selected.splice(i, 1);
              break;
            }
          }
          mljs.clearFacet(searchContext, facet).then(updateSearchResults);
        }
      });
    }]);
}());
