(function () {
  'use strict';

  angular.module('demoCat')
  .factory('User', function() {
    var user = {};

    user.init = function init() {
      user.name = '';
      user.password = '';
      user.loginError = false;
      user.authenticated = false;
      user.hasProfile = false;
      user.fullname = '';
      user.emails = [];
      return user;
    };

    return user.init();
  });
}());
