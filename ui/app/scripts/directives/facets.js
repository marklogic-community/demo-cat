(function () {

  'use strict';

  var module = angular.module('demoCat');

  module.directive('facets', [function () {
    return {
      restrict: 'E',
      scope: {
        facets: '=facetList',
        updateQuery: '&updateQuery'
      },
      templateUrl: '/scripts/directives/facets.html',
      link: function() {
        console.log('facets link');
      }
    };
  }]);
}());
