(function () {
  'use strict';

  angular.module('demoCat')
    .service('featuresService', ['AuthenticationService', 'MLRest', FeaturesService]);

  function FeaturesService(AuthenticationService, MLRest) {

    var service = {
      list: listFeatures
    };

    function listFeatures() {
      if (AuthenticationService.getUser().authenticated) {
        return MLRest.values('features', { options: 'all', format: 'json' }).then(function(resp) {
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
