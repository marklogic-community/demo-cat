(function () {
  'use strict';

  angular.module('demoCat')
    .controller('ProfileCtrl', ['$scope', 'MLRest', '$window', function ($scope, mlRest, win) {
      var model = {
        user: {
          name: '',
          authenticated: false,
          email: ''
        }
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
