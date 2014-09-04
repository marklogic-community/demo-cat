(function () {
  'use strict';

  angular.module('demoCat')
    .provider('Domains', function() {

      var domains = {
        list: [
          'DoD',
          'Intel',
          'PS Civilian',
          'PS Healthcare',
          'Comm Healthcare',
          'FinServ',
          'Media'
        ],
        selItem: '',
        optItem: 'Select...'
      };

      this.$get = function() {
        var service = {
          list: function() {
            return domains;
          }
        };

        return service;
      };
    });
}());
