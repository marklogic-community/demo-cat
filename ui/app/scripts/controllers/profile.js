(function () {
  'use strict';

  angular.module('demoCat')
    .controller('ProfileCtrl', ['$scope', 'MLRest', function ($scope, mlRest) {
      var model = {

      };

      angular.extend($scope, {
        model: model

      });
    }]);
}());
