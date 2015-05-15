(function () {

  'use strict';

  angular
    .module('demoCat')
    .factory('AuthenticationService', AuthService);

  AuthService.$inject = ['$cacheFactory', '$http', '$q', '$rootScope', 'authService', 'MLRest'];
  function AuthService($cacheFactory, $http, $q, $rootScope, authService, MLRest) {

    var user;
    var lastUserCheckTime;
    var cache = $cacheFactory.get('$http');

    var service = {
      getUser: getUser,
      user: function() { return user; },
      login: login,
      logout: logout,
      list: listUsers
    };

    getUser();
    return service;

    function setUser(u) {
      user = {
        name: u.username,
        authenticated: true,
      };

      if (u.profile) {
        user.hasProfile = true;

        user.fullname = u.profile.fullname;

        if ($.isArray(u.profile.emails)) {
          user.emails = u.profile.emails;
        }
        else {
          // wrap single value in array, needed for repeater
          user.emails = [u.profile.emails];
        }

        user.webroles = u.profile.webroles;

        user.isWriter = isWriter;
        user.isAdmin = isAdmin;

        if (u.profile.follows) {
          user.follows = u.profile.follows;
        }
        else {
          // Start with an empty array if user isn't following a demo yet
          user.follows = [];
        }
      }

      function isWriter() {
        return user && user.webroles && user.webroles.indexOf('writer') > -1;
      }

      function isAdmin() {
        return user && user.webroles && user.webroles.indexOf('admin') > -1;
      }

      authService.loginConfirmed(user);
      return user;
    }

    function getUser() {
      var now = (new Date()).getTime();
      // if it has been more than 500ms clear the user status cache
      if (!lastUserCheckTime || (now - lastUserCheckTime) > 500) {
        cache.remove('/user/status');
      }
      return $http.get('/user/status', {cache: true}).then(
          function(data) {
            return setUser(data.data);
          },
          function() {
            return $q.resolve(null);
          }
        );
    }

    function login(username, password) {
      return $http.post('/user/login', {
        username: username,
        password: password
      }, {
        ignoreAuthModule: true
      }).success(function(data) {
        return setUser(data);
      });
    }

    function logout() {
      return $http.post('/user/logout').then(function(data) {
        $rootScope.$broadcast('event:auth-loginRequired', null);
        user = null;
        return data;
      });
    }

    function listUsers() {
      return MLRest.values('fullname', { options: 'user', format: 'json' }).then(function(resp) {
        if (resp.data['values-response']['distinct-value']) {
          return resp.data['values-response']['distinct-value'].map(function(value) {
            return value._value;
          });
        }
      });
    }

  }
})();
