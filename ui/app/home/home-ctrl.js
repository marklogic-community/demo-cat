(function () {
  'use strict';
  angular.module('demoCat.home', []);
  angular.module('demoCat.home')
    .controller('HomeCtrl', ['$scope', '$modal', '$sce', 'user', function ($scope, $modal, $sce, user) {
      var model = { 
        user: user, 
        vanguard: {},
        donttouch: {},
        spotlight: {}
      };
      angular.extend($scope,{
        model: model,
        editVanguard: editVanguard,
        editDontTouch: editDontTouch,
        editSpotlight: editSpotlight
      });
      
      function editVanguard() {
        showModal('/views/modals/edit-vanguard.html', 'Edit Vanguard', model.vanguard);
      }
      
      function editDontTouch() {
        showModal('/views/modals/edit-dont-touch.html', 'Edit Don\'t Touch', model.donttouch);
      }
      
      function editSpotlight() {
        showModal('/views/modals/edit-spotlight.html', 'Edit Spotlight', model.spotlight);
      }
      
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
              return user;
            }
          }
        }).result;
      }
    }]);
}());
