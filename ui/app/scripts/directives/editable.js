(function () {

  'use strict';

  var module = angular.module('demoCat');

  module.directive('editable', [function () {
    return {
      restrict: 'AE',
      scope: {
        enabled: "=enabled",
        editType: '@editType',
        editModel: '=editModel',
        save: '&save',
        editOptions: '=editOptions'
      },
      templateUrl: '/scripts/directives/editable.html',
      link: function($scope) {
        $scope.mode = 'view';
      }
    };
  }]);
}());
