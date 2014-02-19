(function () {

  'use strict';

  var module = angular.module('demoCat');

  module.directive('facets', [function () {
    return {
      restrict: 'E',
      scope: {
        facets: '=facetList',
        select: '&select',
        clear: '&clear'
      },
      templateUrl: '/scripts/directives/facets.html',
      link: function(scope, element, attrs) {
      }
    };
  }]);
}());
