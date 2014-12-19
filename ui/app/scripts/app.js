
angular.module('demoCat', [
  'ngRoute',
  'ngCkeditor',
  'demoCat.user', 'demoCat.search', 'demoCat.common',
  'ui.bootstrap',
  'ngSanitize',
  'autocomplete',
  'ml.common',
  'ml.search',
  'ml.search.tpls',
  'ml.utils'])
  .config(AppConfig);

  AppConfig.$inject = ['$locationProvider', '$routeProvider'];
  function AppConfig($locationProvider, $routeProvider) {

    'use strict';
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
          }
        }
      })
      .when('/edit:uri*', {
        templateUrl: '/views/create.html',
        controller: 'CreateCtrl',
        resolve: {
          edit: function() {
            return true;
          },
          demo: function($route, MLRest) {
            var uri = $route.current.params.uri;
            return MLRest.getDocument(uri, { format: 'json' }).then(function(response) {
              return response.data;
            });
          }
        }
      })
      .when('/detail:uri*', {
        templateUrl: '/views/demo.html',
        controller: 'DemoCtrl'
      })
      .when('/profile', {
        templateUrl: '/views/profile.html',
        controller: 'ProfileCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  }
