(function () {

  'use strict';

  var module = angular.module('demoCat');

  module.directive('features', [function () {
    return {
      restrict: 'E',
      scope: {
        editFeatures: '=editFeatures',
        featureChoices: '=featureChoices',
        editType: '@editType',
        mode: "@mode",
        save: '&save'
      },
      templateUrl: '/scripts/directives/features.html',
      link: function($scope, element, attrs) {

        $scope.addFeature = function() {
          var chosen = null;
          if ($scope.featureChoices.selFeature === '') {
            chosen = $scope.featureChoices.optFeature;
          } else {
            chosen = $scope.featureChoices.selFeature;
          }
          if ($scope.editFeatures.indexOf(chosen) === -1) {
            $scope.editFeatures.push(chosen);
          }
          $scope.featureChoices.selFeature = '';
        }

        $scope.removeFeature = function(feature) {
          var index = $scope.editFeatures.indexOf(feature);
          if (index !== -1) {
            $scope.editFeatures.splice(index, 1);
          }
        }
      }
    };
  }]);
}());
 