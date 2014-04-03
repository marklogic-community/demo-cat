(function () {
  'use strict';

  angular.module('demoCat')
    .controller('ProfileCtrl', ['$scope', 'MLRest', 'User', '$window', function ($scope, mlRest, user, win) {
      var model = {
        user: user // GJo: a bit blunt way to insert the User service, but seems to work
      };
      
      angular.extend($scope, {
        model: model,
        submit: function() {
          mlRest.createDocument($scope.model.user, {
            format: 'json',
            directory: '/users/',
            extension: '.json',
            'perm:demo-cat-role': 'read',
            'perm:demo-cat-registered-role': 'update'
          }).then(function(data) {
            win.location.href = '/';
          });
        }
      });
    }]);
}());
