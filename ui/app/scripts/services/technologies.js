(function () {
  'use strict';

  angular.module('demoCat')
    .service('technologiesService', TechnologiesService);

  function TechnologiesService(MLRest) {

    var service = {
      list: listTechnologies
    };

    function listTechnologies() {
      return MLRest.values('technologies', { options: 'all', format: 'json' }).then(function(resp) {
        if (resp.data['values-response']['distinct-value']) {
          return resp.data['values-response']['distinct-value'].map(function(value) {
            return value._value;
          });
        }
      });
    }
    return service;
  }
}());
