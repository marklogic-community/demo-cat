(function () {
  'use strict';

  angular.module('demoCat')
    .controller('ProfileCtrl', ['$scope', 'MLRest', 'User', '$location', function ($scope, mlRest, user, $location) {
      var model = {
        user: user, // GJo: a bit blunt way to insert the User service, but seems to work
        newEmail: ''
      };

      angular.extend($scope, {
        model: model,
        addEmail: function() {
          if ($scope.profileForm.newEmail.$error.email) {
            return;
          }
          if (!$scope.model.user.emails) {
            $scope.model.user.emails = [];
          }
          $scope.model.user.emails.push(model.newEmail);
          model.newEmail = '';
        },
        removeEmail: function(index) {
          $scope.model.user.emails.splice(index, 1);
        },
        submit: function() {
          mlRest.updateDocument({
            user: {
              'fullname': $scope.model.user.fullname,
              'emails': $scope.model.user.emails
            }
          }, {
            format: 'json',
            uri: '/users/' + $scope.model.user.name + '.json'
            // [GJo] Better to rely on default permissions..
            //,
            //'perm:demo-cat-role': 'read',
            //'perm:demo-cat-registered-role': 'update'
          }).then(function(data) {
            $location.path('/');
          });
        }
      });
    }]);
}());
