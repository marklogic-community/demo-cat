(function () {
  'use strict';

  angular.module('demoCat')
    .controller('HeaderCtrl', HeaderCtrl);

  function HeaderCtrl($scope, $http, $location, AuthenticationService) {

    angular.extend($scope, {
      logout: logout
    });

    $scope.$watch(AuthenticationService.user, function(newValue) {
      $scope.user = newValue;
    });

    function logout() {
      AuthenticationService.logout();
     }
  }

}());
