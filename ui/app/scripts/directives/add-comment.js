(function () {

  'use strict';

  var module = angular.module('demoCat');

  module.directive('addComment', [function () {
    return {
      restrict: 'E',
      scope: {
        authenticated: '=authenticated',
        addModel: '=addModel',
        save: '&save'
      },
      templateUrl: '/scripts/directives/add-comment.html',
      link: function($scope) {
        
      }
    };
  }]);
}());
