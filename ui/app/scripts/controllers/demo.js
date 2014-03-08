(function () {
  'use strict';

  angular.module('demoCat')
    .controller('DemoCtrl', ['$scope', 'MLRest', 'Features', '$routeParams', function ($scope, mlRest, features, $routeParams) {
      var uri = $routeParams.uri;
      var model = {
        // your model stuff here
        edit: '',
        featureChoices: features.list()
      };

      mlRest.getDocument(uri, { format: 'json' }).then(function(data) {
        model.demo = data;
      });

      angular.extend($scope, {
        model: model,

        saveField: function(field, value) {
          mlRest.patch(
            uri,
            {
              'patch': [
                {
                  'replace': {
                    'select': '$.' + field,
                    'content': value
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
