(function () {

  'use strict';

  var module = angular.module('demoCat');

  module.directive('mlHeader', HeaderDirective);

  function HeaderDirective() {
    return {
      restrict: 'E',
      controller: 'HeaderCtrl',
      replace: true,
      templateUrl: '/views/header/header.html'
    };
  }
}());
