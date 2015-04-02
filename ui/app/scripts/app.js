(function () {

  'use strict';

  angular.module('demoCat', [
    'ngRoute',
    'ngCkeditor',
    'demoCat.search', 'demoCat.common',
    'ui.bootstrap',
    'ngSanitize',
    'autocomplete',
    'ml.common',
    'ml.search',
    'ml.search.tpls',
    'angularFileUpload',
    'ml.utils',
    'http-auth-interceptor'])
    .config(AppConfig)
    .run(AppRun);

  AppConfig.$inject = ['$locationProvider', '$routeProvider'];
  function AppConfig($locationProvider, $routeProvider) {

    $locationProvider.html5Mode(true);
    $locationProvider.hashPrefix('!');

    $routeProvider
      .when('/', {
        templateUrl: '/search/search.html',
        controller:'SearchCtrl',
        reloadOnSearch: false
      })
      .when('/create', {
        templateUrl: '/views/create.html',
        controller: 'CreateCtrl',
        resolve: {
          edit: function() {
            return false;
          },
          demo: function() {
            return null;
          },
          domains: function(domainsService) {
            return domainsService.list();
          },
          features: function(featuresService) {
            return featuresService.list();
          },
          technologies: function(technologiesService) {
            return technologiesService.list();
          }
        }
      })
      .when('/edit:uri*', {
        templateUrl: '/views/create.html',
        controller: 'CreateCtrl',
        resolve: {
          // send non-writers to the main page
          checkAuth: function(AuthenticationService, $location) {
            AuthenticationService.getUser().then(function(user) {
              if (!user.isWriter()) {
                $location.url('/');
              }
            });
          },
          edit: function() {
            return true;
          },
          demo: function($route, MLRest) {
            var uri = $route.current.params.uri;
            return MLRest.getDocument(uri, { format: 'json' }).then(function(response) {
              return response.data;
            });
          },
          domains: function(domainsService) {
            return domainsService.list();
          },
          features: function(featuresService) {
            return featuresService.list();
          },
          technologies: function(technologiesService) {
            return technologiesService.list();
          }
        }
      })
      .when('/detail:uri*', {
        templateUrl: '/views/demo.html',
        controller: 'DemoCtrl',
        resolve: {
          demo: function($route, MLRest) {
            var uri = $route.current.params.uri;
            return MLRest.getDocument(uri, { format: 'json' }).then(function(response) {
              return response.data;
            });
          },
          user: function(AuthenticationService) {
            return AuthenticationService.getUser();
          }
        }
      })
      .when('/profile', {
        templateUrl: '/views/profile.html',
        controller: 'ProfileCtrl',
        resolve: {
          user: function(AuthenticationService) {
            return AuthenticationService.getUser();
          }
        }
      })
      .when('/login:url?', {
        templateUrl: '/views/login.html',
        controller: 'LoginCtrl',
        resolve: {
          moveAlong: function(AuthenticationService, $route, $location) {
            var user = AuthenticationService.user();
            if (user && user.authenticated) {
              var uri = $route.current.params.url;
              if (uri) {
                $location.url(uri);
              }
              else {
                $location.url('/');
              }
            }
          }
        }
      })
      .otherwise({
        redirectTo: '/'
      });
  }

  function AppRun($rootScope, $location) {
    $rootScope.$on('event:auth-loginRequired', function() {
      if ($location.path() !== '/login') {
        $location.url('/login?url=' + $location.path());
      }
    });
  }

})();
