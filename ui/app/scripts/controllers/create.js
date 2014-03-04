(function () {
  'use strict';

  angular.module('demoCat')
    .controller('CreateCtrl', ['$scope', 'MLJS', 'Features', function ($scope, mljs, features) {
      var model = {
        demo: {
          name: '',
          description: '',
          host: '',
          hostType: 'internal',
          browsers: [
            { name: 'Firefox', selected: false },
            { name: 'Chrome', selected: false },
            { name: 'IE', selected: false }
          ],
          features: [],
          languages: []
        },
        featureChoices: features.list()
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
        submit: function() {
          mljs.createDocument($scope.model.demo, null).then(function(data) {
            window.location.href = '/detail?uri=' + data.replace(/(.*\?uri=)/, '');
          });
        }
      });
    }]);
}());
