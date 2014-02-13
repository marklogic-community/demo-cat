(function () {
  'use strict';

  angular.module('demoCat')
    .controller('DemoCtrl', ['$scope', 'MLRest', '$routeParams', function ($scope, mlRest, $routeParams) {
      var uri = $routeParams.uri;
      var model = {
        // your model stuff here
        edit: ''
      };

      console.log('DemoCtrl: uri=' + $routeParams.uri);
      mlRest.getDocument(uri).then(function(data) {
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
