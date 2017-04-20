(function () {
  'use strict';

  angular.module('demoCat')
    .controller('HeaderCtrl', ['$scope', '$http', '$location', 'AuthenticationService', 'ModalService', 'SearchModel', HeaderCtrl]);

  function HeaderCtrl($scope, $http, $location, AuthenticationService, modal, model) {

    angular.extend($scope, {
      logout: logout,
      showHelp: showHelp,
      showAll: showAll
    });
    
    $scope.$on('showAll', function(){
      showAll();
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
    
    function showAll() {
      if ($location.path() != '/search') {
        model.search.results = null;
      }
      model.qtext= "";
      $location.path('/search').search({q:null, clear:'true'});
    }
  }

}());
