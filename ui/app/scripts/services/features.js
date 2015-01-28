(function () {
  'use strict';

  angular.module('demoCat')
    .service('featuresService', FeaturesService);

  function FeaturesService(MLRest) {

    var service = {
      list: listFeatures
    };

    function listFeatures() {
      return MLRest.values('features', { options: 'all', format: 'json' }).then(function(resp) {
        return resp.data['values-response']['distinct-value'].map(function(value) {
          return value._value;
        });
      });
    }
    return service;
  }
}());
