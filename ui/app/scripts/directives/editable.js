(function () {

  'use strict';

  var module = angular.module('demoCat');

  module.directive('editable', [function () {
    return {
      restrict: 'AE',
      scope: {
        editType: '@editType',
        editModel: '=editModel',
        save: '&save'
      },
      templateUrl: '/scripts/directives/editable.html',
      link: function($scope) {
        console.log('editable');
        $scope.mode = 'view';
      }
    };
  }]);
}());
