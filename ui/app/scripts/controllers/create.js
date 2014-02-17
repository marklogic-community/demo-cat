(function () {
  'use strict';

  angular.module('demoCat')
    .controller('CreateCtrl', ['$scope', 'MLJS', 'Features', function ($scope, mljs, features) {
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
          features: [],
          languages: []
        },
        featureChoices: features.list(),
        selFeature: '',
        optFeature: 'Select...'
      };

      angular.extend($scope, {
        model: model,
        addFeature: function() {
          var chosen = null;
          if ($scope.model.selFeature === '') {
            chosen = $scope.model.optFeature;
          } else {
            chosen = $scope.model.selFeature;
          }
          if ($scope.model.demo.features.indexOf(chosen) === -1) {
            $scope.model.demo.features.push(chosen);
          }
          $scope.model.selFeature = '';
        },
        removeFeature: function(feature) {
          var index = $scope.model.demo.features.indexOf(feature);
          if (index !== -1) {
            $scope.model.demo.features.splice(index, 1);
          }
        },
        submit: function() {
          mljs.createDocument($scope.model.demo, null).then(function(data) {
            window.location.href = '/detail?uri=' + data.replace(/(.*\?uri=)/, "");
          });
        }
      });
    }]);
}());
