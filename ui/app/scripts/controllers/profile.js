(function () {
  'use strict';

  angular.module('demoCat')
    .controller('ProfileCtrl', ProfileCtrl);

  ProfileCtrl.$inject = ['$scope', 'MLRest', '$location', 'user'];
  
  function ProfileCtrl($scope, mlRest, $location, user) {
    var model = {
      user: user,
      newEmail: '',
      message: undefined
    };

    angular.extend($scope, {
      model: model,
      addEmail: function() {
        if ($scope.profileForm.newEmail.$error.email) {
          return;
        }
        if (!model.user.emails) {
          model.user.emails = [];
        }
        model.user.emails.push(model.newEmail);
        model.newEmail = '';
      },
      removeEmail: function(index) {
        model.user.emails.splice(index, 1);
      },
      submit: function() {
        model.message = undefined;
        mlRest.callExtension('profile', {
          method: 'PUT',
          data: {
            user: {
              fullname: model.user.fullname,
              emails: model.user.emails,
              follows: model.user.follows
            }
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }).then(function(){
          model.message = 'Profile stored successfully';
        });
      }
    });
  }
}());
