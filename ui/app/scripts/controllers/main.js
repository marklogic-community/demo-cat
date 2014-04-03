(function () {
  'use strict';

  angular.module('demoCat')
    .controller('MainCtrl', ['$scope', 'MLRest', 'User', '$location', function ($scope, mlRest, user, $location) {
      var model = {
        selected: [],
        text: '',
        user: user // GJo: a bit blunt way to insert the User service, but seems to work
      };

      var searchContext = mlRest.createSearchContext();

      function updateSearchResults(data) {
        model.search = data;
      }

      function updateUser(data) {
        if (data.authenticated === true) {
          model.user.name = data.username;
          model.user.authenticated = true;
          if (data.profile !== undefined) {
            model.user.hasProfile = true;
            model.user.email = data.profile.email;
          }
        }
      }

      (function init() {
        mlRest.checkLoginStatus().then(updateUser);
        searchContext.search().then(updateSearchResults);
      })();
      
      angular.extend($scope, {
        model: model,
        selectFacet: function(facet, value) {
          var existing = model.selected.filter( function( selectedFacet ) {
            return selectedFacet.facet === facet && selectedFacet.value === value;
          });
          if ( existing.length === 0 ) {
            model.selected.push({facet: facet, value: value});
            searchContext.selectFacet(facet, value).then(updateSearchResults);
          }
        },
        clearFacet: function(facet, value) {
          var i;
          for (i = 0; i < model.selected.length; i++) {
            if (model.selected[i].facet === facet && model.selected[i].value === value) {
              model.selected.splice(i, 1);
              break;
            }
          }
          searchContext.clearFacet(facet, value).then(updateSearchResults);
        },
        textSearch: function() {
          searchContext.setText(model.text).then(updateSearchResults);
          $location.path('/');
        },
        login: function(username, password) {
          mlRest.login(username, password).then(function (result) {
            if (result === 'success') {
              model.user.authenticated = true;
              if (model.user.hasProfile === false) {
                $location.path('/profile');
              }
            } else {
              model.user.loginError = true;
              //alert('authentication failed');
            }
          });
        },
        logout: function() {
          mlRest.logout().then(function() {
            model.user.name = '';
            model.user.password = '';
            model.user.authenticated = false;
          });
        }
      });
    }]);
}());
