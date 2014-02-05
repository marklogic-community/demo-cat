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
        ],
        features: []
      };

      angular.extend($scope, {
        model: model,
        addFeature: function() {
          if ($scope.model.features.indexOf($scope.model.selFeature) === -1) {
            $scope.model.features.push($scope.model.selFeature);
          }
          $scope.model.selFeature = '';
        },
        removeFeature: function(feature) {
          var index = $scope.model.features.indexOf(feature);
          if (index !== -1) {
            $scope.model.features.splice(index, 1);
          }
        }
      });
    }]);
}());
