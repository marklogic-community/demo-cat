(function () {

  'use strict';

  var module = angular.module('demoCat');

  module.directive('items', [function () {
    return {
      restrict: 'E',
      scope: {
        enabled: '=enabled',
        editItems: '=editItems',
        itemChoices: '=itemChoices',
        editType: '@editType',
        mode: '@mode',
        save: '&save',
        label: '@label'
      },
      templateUrl: '/scripts/directives/items.html',
      link: function($scope) {

        $scope.addItem = function() {
          var chosen = null;
          if ($scope.itemChoices.selItem === '') {
            chosen = $scope.itemChoices.optItem;
          } else {
            chosen = $scope.itemChoices.selItem;
          }
          // Handle the case if the dataset is missing the particular array.  Useful
          // if adding additional information to a record that was not there when the
          // dataset was initially created.
          if (!$scope.editItems) {
            $scope.editItems = [];
          }
          if ($scope.editItems.indexOf(chosen) === -1) {
            $scope.editItems.push(chosen);
          }
          $scope.itemChoices.selItem = '';
        };

        $scope.removeItem = function(item) {
          var index = $scope.editItems.indexOf(item);
          if (index !== -1) {
            $scope.editItems.splice(index, 1);
          }
        };
      }
    };
  }]);
}());

