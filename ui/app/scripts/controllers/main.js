(function () {
  'use strict';

  angular.module('demoCat')
    .controller('MainCtrl', ['$scope', 'MLRest', function ($scope, mlRest) {
      var model = {
        // your model stuff here
      };

      var results = mlRest.search().then(function(data) {
        model.search = data;
      });

      angular.extend($scope, {
        model: model
      });
    }]);
}());
