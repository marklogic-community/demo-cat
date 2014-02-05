(function () {
  'use strict';

  angular.module('demoCat')
    .controller('MainCtrl', ['$scope', function ($scope) {
      var model = {
        awesomeThings: [
          'HTML5 Boilerplate',
          'AngularJS',
          'Karma'
        ]
        // your model stuff here
      };

      angular.extend($scope, {
        model: model
      });
    }]);
}());
