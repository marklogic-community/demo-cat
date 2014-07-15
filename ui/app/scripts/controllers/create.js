(function () {
  'use strict';

  angular.module('demoCat')
    .controller('CreateCtrl', ['$scope', 'Features', 'User', '$window', '$http', function ($scope, features, user, win, $http) {
      var model = {
        demo: {
          name: '',
          description: '',
          host: '',
          hostType: 'internal',
          browsers: [],
          features: [],
          languages: [],
          bugs: [],
          comments: []
        },
        featureChoices: features.list(),
        browserChoices: ['Firefox', 'Chrome', 'IE'],
        user: user // GJo: a bit blunt way to insert the User service, but seems to work
      };

      angular.extend($scope, {
        model: model,
        editorOptions: {
          height: '100px',
          toolbarGroups: [
            { name: 'clipboard',   groups: [ 'clipboard', 'undo' ] },
            { name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ] },
            { name: 'paragraph', groups: [ 'list', 'indent', 'blocks', 'align', 'bidi' ] },
            { name: 'links' }
          ],
          //override default options
          toolbar: '',
          /* jshint camelcase: false */
          toolbar_full: ''
        },
        updateBrowsers: function(browser) {
          var index = $scope.model.demo.browsers.indexOf(browser);
          if (index > -1) {
            $scope.model.demo.browsers.splice(index, 1);
          } else {
            $scope.model.demo.browsers.push(browser);
          }
        },
        submit: function() {
          $http.post('/demo/create', $scope.model.demo, {
            params: {
              format: 'json',
              directory: '/demos/',
              extension: '.json',
              'perm:demo-cat-role': 'read',
              'perm:demo-cat-registered-role': 'update'
            }
          }).then(function(response) {
            win.location.href = '/detail?uri=' + response.data.href.replace(/(.*\?uri=)/, '');
          });
        }
      });
    }]);
}());
