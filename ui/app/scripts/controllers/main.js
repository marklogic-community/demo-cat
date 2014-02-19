(function () {
  'use strict';

  angular.module('demoCat')
    .controller('MainCtrl', ['$scope', 'MLJS', function ($scope, mljs) {
      var model = {
        // your model stuff here
      };

      var results = mljs.search().then(function(data) {
        model.search = data;
      });

      angular.extend($scope, {
        model: model,
        selectFacet: function(facet, value) {
          console.log('selected facet ' + facet + ' with value ' + value);
        },
        clearFacet: function(facet) {
          console.log('clearing facet ' + facet);
        }
      });
    }]);
}());
