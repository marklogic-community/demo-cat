(function () {
  'use strict';

  angular.module('demoCat')
    .controller('CreateCtrl', ['$scope', function ($scope) {
      var model = {
        name: '',
        description: '',
        host: '',
        hostType: 'internal',
        browsers: [
          { name: 'Firefox', selected: false },
          { name: 'Chrome', selected: false },
          { name: 'IE', selected: false }
        ]
      };

      angular.extend($scope, {
        model: model
      });
    }]);
}());
