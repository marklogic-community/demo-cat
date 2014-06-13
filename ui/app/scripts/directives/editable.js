(function () {

  'use strict';

  var module = angular.module('demoCat');

  module.directive('editable', ['$timeout',function ($timeout) {
    return {
      restrict: 'AE',
      scope: {
        enabled: '=enabled',
        editType: '@editType',
        editModel: '=editModel',
        save: '&save',
        editOptions: '=editOptions',
        richTextOptions: '=',
        prefix: '@prefix'
      },
      // Rich text uses its own template. If done together, the ckEditor for rich text adds a <p> wrapper to
      // non-rich-text content. That can be prevented with ng-if, but that triggers a new scope, meaning you
      // can't actually change the content.
      templateUrl: function(tElement, tAttrs) {
        if (tAttrs.editType === 'richtext') {
          return '/scripts/directives/editable-richtext.html';
        }
        return '/scripts/directives/editable.html';
      },
      link: function($scope) {
        $scope.mode = 'view';
        $scope.delayedSave = function() {
          $timeout(
            function () {
              $scope.save();
            },
            0
          );
        };
      }
    };
  }]);
}());
