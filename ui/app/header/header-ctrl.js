(function () {
  'use strict';

  angular.module('demoCat')
    .controller('HeaderCtrl', ['$scope', '$http', '$location', 'AuthenticationService', 'ModalService', HeaderCtrl]);

  function HeaderCtrl($scope, $http, $location, AuthenticationService, modal) {

    angular.extend($scope, {
      logout: logout,
      showHelp: showHelp
    });

    $scope.$watch(AuthenticationService.user, function(newValue) {
      $scope.user = newValue;
    });

    function logout() {
      AuthenticationService.logout();
    }
    
    function showHelp() {
      modal.show('/views/modals/help.html', 'Help');
    }
  }

}());
