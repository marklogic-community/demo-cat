(function () {

  'use strict';

  var module = angular.module('demoCat');

  module.directive('addComment', [function () {
    return {
      restrict: 'E',
      scope: {
        addModel: '=addModel',
        save: '&save'
      },
      templateUrl: '/scripts/directives/add-comment.html'
    };
  }]);
}());
