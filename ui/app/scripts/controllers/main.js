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
        updateQuery: function() {
          console.log('updateQuery');
        }
      });
    }]);
}());
