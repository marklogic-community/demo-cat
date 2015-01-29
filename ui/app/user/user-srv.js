(function () {
  'use strict';

  angular.module('demoCat.user')
  .factory('User', ['$http', function($http) {
    var user = {};
    user.isWriter = isWriter;
    user.isAdmin = isAdmin;

    function updateUser(response) {
      var data = response.data;
      if (data.authenticated === true) {
        user.name = data.username;
        user.authenticated = true;
        if (data.profile !== undefined) {
          user.hasProfile = true;

          user.fullname = data.profile.fullname;

          if ($.isArray(data.profile.emails)) {
            user.emails = data.profile.emails;
          } else {
            // wrap single value in array, needed for repeater
            user.emails = [data.profile.emails];
          }

          user.webroles = data.profile.webroles;
        }
      }
    }

    function isWriter() {
      return user.webroles.indexOf('writer') > -1;
    };

    function isAdmin() {
      return user.webroles.indexOf('admin') > -1;
    };

    user.init = function init() {
      user.name = '';
      user.password = '';
      user.loginError = false;
      user.authenticated = false;
      user.hasProfile = false;
      user.fullname = '';
      user.emails = [];
      user.webroles = [];
      return user;
    };

    (function(){
      user.init();
      $http.get('/user/status', {}).then(updateUser);
    })();

    return user;
  }]);
}());
