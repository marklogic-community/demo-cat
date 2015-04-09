(function () {
  'use strict';
  angular.module('demoCat.home', []);
  angular.module('demoCat.home')
    .controller('HomeCtrl', ['$scope', function ($scope) {
      var model = {};
      angular.extend($scope,{
        model: model
      });
    }]);
}());
