
angular.module('demoCat', ['ngRoute'])
  .config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {

    'use strict';

    $locationProvider.html5Mode(true);

    $routeProvider
      .when('/', {
        templateUrl: '/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/create', {
        templateUrl: '/views/create.html',
        controller: 'CreateCtrl'
      })
      .when('/detail', {
        templateUrl: '/views/demo.html',
        controller: 'DemoCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  }]);
