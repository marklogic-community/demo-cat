
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
  .config(['$locationProvider', '$routeProvider', function ($locationProvider, $routeProvider) {

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
        controller: 'CreateCtrl'
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
  }]);
