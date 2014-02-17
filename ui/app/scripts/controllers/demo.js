(function () {
  'use strict';

  angular.module('demoCat')
    .controller('DemoCtrl', ['$scope', 'MLJS', '$routeParams', function ($scope, mljs, $routeParams) {
      var uri = $routeParams.uri;
      var model = {
        // your model stuff here
        edit: ''
      };

      console.log('DemoCtrl: uri=' + $routeParams.uri);
      mljs.getDocument(uri).then(function(data) {
        model.demo = data;
      });

      angular.extend($scope, {
        model: model,

        saveField: function(field, value) {
          mlRest.patch(
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
