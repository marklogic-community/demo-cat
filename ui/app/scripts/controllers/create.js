(function () {
  'use strict';

  angular.module('demoCat')
    .controller('CreateCtrl', ['$scope', 'MLJS', 'Features', "$window", function ($scope, mljs, features, win) {
      var model = {
        demo: {
          name: '',
          description: '',
          host: '',
          hostType: 'internal',
          browsers: [],
          features: [],
          languages: []
        },
        featureChoices: features.list(),
        browserChoices: ['Firefox', 'Chrome', 'IE']
      };

      angular.extend($scope, {
        model: model,
        editorOptions: {
          height: "100px",
          toolbarGroups: [
            { name: 'clipboard',   groups: [ 'clipboard', 'undo' ] },
            { name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ] }
          ],
          //override default options
          toolbar: "",
          toolbar_full: ""
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
          mljs.createDocument($scope.model.demo, null).then(function(data) {
            win.location.href = '/detail?uri=' + data.replace(/(.*\?uri=)/, '');
          });
        }
      });
    }]);
}());
