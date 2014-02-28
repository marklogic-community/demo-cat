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
        featureChoices: features.list()
      };

      angular.extend($scope, {
        model: model,
        submit: function() {
          mljs.createDocument($scope.model.demo, null).then(function(data) {
            window.location.href = '/detail?uri=' + data.replace(/(.*\?uri=)/, "");
          });
        }
      });
    }]);
}());
