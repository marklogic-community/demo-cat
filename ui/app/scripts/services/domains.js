(function () {
  'use strict';

  angular.module('demoCat')
    .service('domainsService', ['AuthenticationService', 'MLRest', DomainsService]);

  function DomainsService(AuthenticationService, MLRest) {

    var service = {
      list: listFeatures
    };

    function listFeatures() {
      if (AuthenticationService.getUser().authenticated) {
        return MLRest.values('domains', { options: 'all', format: 'json' }).then(function(resp) {
          if (resp.data['values-response']['distinct-value']) {
            return resp.data['values-response']['distinct-value'].map(function(value) {
              return value._value;
            });
          }
        });
      }
    }
    return service;
  }
}());
