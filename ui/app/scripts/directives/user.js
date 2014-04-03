(function () {

  'use strict';

  var module = angular.module('demoCat');

  module.directive('mlUser', ['User', function (user) {
    return {
      restrict: 'A',
      replace: true,
      scope: {
        username: '=',
        password: '=',
        authenticated: '=',
        login: '&',
        logout: '&',
        loginError: '='
      },
      templateUrl: '/scripts/directives/user.html',
      link: function($scope) {

      }
    };
  }]);
}());
