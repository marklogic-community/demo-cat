(function () {

  'use strict';

  angular
    .module('demoCat')
    .factory('AuthenticationService', AuthService);

  AuthService.$inject = ['$http', '$q', '$rootScope', 'authService', 'MLRest'];
  function AuthService($http, $q, $rootScope, authService, MLRest) {

    var user;
    var userRequest;

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
      if (user) {
        var d = $q.defer();
        d.resolve(user);
        return d.promise;
      }
      else {
        if (!userRequest) {
          userRequest = $http.get('/user/status').then(function(data) {
            userRequest = null;
            return setUser(data.data);
          });
        }
        return userRequest;
      }
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
