(function () {

  'use strict';

  var module = angular.module('demoCat');

  module.directive('mlUser', ['User', function (user) {
    return {
      restrict: 'A',
      replace: true,
      scope: {
        username: '=username',
        password: '=password',
        authenticated: '=authenticated',
        login: '&login',
        logout: '&logout',
        loginerror: '=loginerror'
      },
      templateUrl: '/scripts/directives/user.html',
      link: function($scope) {

      }
    };
  }]);
}());
