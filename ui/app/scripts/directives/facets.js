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
        console.log('facets link');
        scope.selectFacet = function(name, value) {
          console.log('select: ' + name + ': ' + value);
          scope.select({facet: name, value: value});
        };
        scope.clearFacet = function(name) {
          console.log('clear facet ' + name);
        };
      }
    };
  }]);
}());
