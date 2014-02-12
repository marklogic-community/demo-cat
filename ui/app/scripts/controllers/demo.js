(function () {
  'use strict';

  angular.module('demoCat')
    .controller('DemoCtrl', ['$scope', 'MLRest', '$routeParams', function ($scope, mlRest, $routeParams) {
      var model = {
        // your model stuff here
      };

      console.log('DemoCtrl: uri=' + $routeParams.uri);
      mlRest.getDocument($routeParams.uri).then(function(data) {
        model.demo = data;
      });

      angular.extend($scope, {
        model: model
      });
    }]);
}());
