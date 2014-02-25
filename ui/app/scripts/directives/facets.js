(function () {

  'use strict';

  var module = angular.module('demoCat');

  module.directive('facets', [function () {
    return {
      restrict: 'E',
      scope: {
        facets: '=facetList',
        selected: '=selected',
        select: '&select',
        clear: '&clear'
      },
      templateUrl: '/scripts/directives/facets.html',
      link: function(scope, element, attrs) {
        scope.sayHello = function() {
          console.log('hello');
        };
      }
    };
  }]);
}());
