(function () {
  'use strict';

  angular.module('demoCat')
    .controller('ProfileCtrl', ['$scope', 'MLRest', 'User', '$location', function ($scope, mlRest, user, $location) {
      var model = {
        user: user // GJo: a bit blunt way to insert the User service, but seems to work
      };
      
      angular.extend($scope, {
        model: model,
        submit: function() {
          mlRest.updateDocument({
            user: {
              "name": $scope.model.user.name,
              "email": $scope.model.user.email
            }
          }, {
            format: 'json',
            uri: '/users/' + $scope.model.user.name + '.json',
            'perm:demo-cat-role': 'read',
            'perm:demo-cat-registered-role': 'update'
          }).then(function(data) {
            $location.path('/');
          });
        }
      });
    }]);
}());
