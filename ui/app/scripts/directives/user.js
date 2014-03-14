(function () {

  'use strict';

  var module = angular.module('demoCat');

  module.directive('mlUser', [function () {
    return {
      restrict: 'A',
      replace: true,
      scope: {
        username: '=',
        password: '=',
        authenticated: '=',
        login: '&login',
        logout: '&logout'
      },
      templateUrl: '/scripts/directives/user.html',
      link: function($scope) {

      }
    };
  }]);
}());
