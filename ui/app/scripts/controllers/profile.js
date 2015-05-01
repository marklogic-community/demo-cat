(function () {
  'use strict';

  angular.module('demoCat')
    .controller('ProfileCtrl', ProfileCtrl);

    ProfileCtrl.$inject = ['$scope', 'MLRest', '$location', 'user'];
    function ProfileCtrl($scope, mlRest, $location, user) {
      var model = {
        user: user,
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
              fullname: $scope.model.user.fullname,
              emails: $scope.model.user.emails,
              follows: $scope.model.user.follows
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
    }
}());
