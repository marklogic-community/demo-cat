(function () {
  'use strict';

  angular.module('demoCat')
    .controller('DemoCtrl', ['$scope', 'MLRest', 'Features', 'User', '$routeParams', function ($scope, mlRest, features, user, $routeParams) {
      var uri = $routeParams.uri;
      var model = {
        // your model stuff here
        edit: '',
        featureChoices: features.list(),
        user: user // GJo: a bit blunt way to insert the User service, but seems to work
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
