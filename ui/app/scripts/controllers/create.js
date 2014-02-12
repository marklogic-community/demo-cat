(function () {
  'use strict';

  angular.module('demoCat')
    .controller('CreateCtrl', ['$scope', 'MLRest', function ($scope, mlRest) {
      var model = {
        demo: {
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
        }
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
        },
        submit: function() {
          mlRest.createDocument($scope.model.demo, null).then(function(data) {
            window.location.href = '/detail?uri=' + data.replace(/(.*\?uri=)/, "");
          });
        }
      });
    }]);
}());
