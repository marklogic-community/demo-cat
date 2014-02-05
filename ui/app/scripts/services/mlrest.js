(function () {
  'use strict';

  angular.module('demoCat')
    .provider('MLRest', function() {

      this.$get = function($q, $http) {
        var service = {
          search: function() {

          },
          getDocument: function(uri) {

          }
        };

        return service;
      };
    });
}());
