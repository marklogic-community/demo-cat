(function () {
  'use strict';

  angular.module('demoCat')
  .factory('User', function() {
    return {
      name: "",
      password: "",
      loginError: false,
      authenticated: false,
      hasProfile: false,
      email: ""
    }
  })
}());
