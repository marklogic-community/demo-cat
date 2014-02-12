(function () {

  'use strict';

  var module = angular.module('demoCat');

  module.directive('results', [function () {
    return {
      restrict: 'E',
      scope: {
        results: '=resultList',
        updateQuery: '&updateQuery'
      },
      templateUrl: '/scripts/directives/results.html',
      link: function() {
        console.log('results');
      }
    };
  }]);
}());
