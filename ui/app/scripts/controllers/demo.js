(function () {
  'use strict';

  angular.module('demoCat')
    .controller('DemoCtrl', ['$scope', 'MLJS', 'Features', '$routeParams', function ($scope, mljs, features, $routeParams) {
      var uri = $routeParams.uri;
      var model = {
        // your model stuff here
        edit: '',
        featureChoices: features.list()
      };

      console.log('DemoCtrl: uri=' + $routeParams.uri);
      mljs.getDocument(uri).then(function(data) {
        model.demo = data;
      });

      angular.extend($scope, {
        model: model,

        saveField: function(field, value) {
          mljs.patch(
            uri,
            {
              "patch": [
                {
                  "replace": {
                    "select": "$." + field,
                    "content": value
                  }
                }
              ]
            }
          );
          model.edit = '';
        }
      });
    }]);
}());
