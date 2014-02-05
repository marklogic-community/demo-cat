(function () {

  'use strict';

  var module = angular.module('demoCat');

  module.directive('facets', [function () {
    return {
      restrict: 'E',
      scope: {
        facets: '@ngModel',
        updateQuery: '&updateQuery'
      },
      template: '<div class="facet-list"></div>',
      link: function() {

      }
    };
  }]);
}());
