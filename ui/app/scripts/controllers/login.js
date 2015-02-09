(function () {
  'use strict';

  angular.module('demoCat.search')
    .controller('LoginCtrl', LoginCtrl);

  function LoginCtrl($scope, $location, $routeParams, AuthenticationService) {
    angular.extend($scope, {
      login: login,
      username: null,
      password: null,
      loginError: false
    });

    function login(username, password) {
      $scope.loginError = false;
      AuthenticationService.login(username, password).then(function(user) {
        if ($routeParams.url) {
          $location.url($routeParams.url);
        }
        else {
          $location.url('/');
        }
      },
      function() {
        $scope.loginError = true;
      });
    }
  }

}());
