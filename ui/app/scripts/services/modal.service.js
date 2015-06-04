(function () {
  'use strict';

  angular.module('demoCat')
  .service('ModalService', ['$modal', '$sce', 'AuthenticationService', ModalService]);

  function ModalService($modal, $sce, AuthenticationService) {

    var service = {
      show: showModal
    };

    return service;

    function showModal(template, title, model, validate) {
      return $modal.open({
        templateUrl: template+'',
        controller: function ($scope, $modalInstance, title, model, validate, user) {
          $scope.title = title;
          $scope.model = model;
          $scope.user = user;
          $scope.alerts = [];
          $scope.ok = function () {
            if (validate) {
              $scope.alerts = validate($scope.model);
            }
            if ($scope.alerts.length === 0) {
              $modalInstance.close($scope.model);
            }
          };
          $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
          };
          $scope.encodeURIComponent = encodeURIComponent;
          $scope.trustUrl = $sce.trustAsResourceUrl;
        },
        size: 'lg',
        resolve: {
          title: function () {
            return title;
          },
          model: function () {
            return model;
          },
          validate: function () {
            return validate;
          },
          user: function () {
            return AuthenticationService.getUser();
          }
        }
      }).result;
    }
    
  }
}());
