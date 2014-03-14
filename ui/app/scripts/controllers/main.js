(function () {
  'use strict';

  angular.module('demoCat')
    .controller('MainCtrl', ['$scope', 'MLRest', function ($scope, mlRest) {
      var model = {
        selected: [],
        text: '',
        user: {
          name: '',
          password: '',
          authenticated: false
        }
      };

      var searchContext = mlRest.createSearchContext();

      function updateSearchResults(data) {
        model.search = data;
      }

      mlRest.search(searchContext).then(updateSearchResults);

      angular.extend($scope, {
        model: model,
        selectFacet: function(facet, value) {
          var existing = model.selected.filter( function( selectedFacet ) {
            return selectedFacet.facet === facet && selectedFacet.value === value;
          });
          if ( existing.length === 0 ) {
            model.selected.push({facet: facet, value: value});
            mlRest.selectFacet(searchContext, facet, value).then(updateSearchResults);
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
          mlRest.clearFacet(searchContext, facet, value).then(updateSearchResults);
        },
        textSearch: function() {
          mlRest.textSearch(searchContext, model.text).then(updateSearchResults);
        },
        login: function(username, password) {
          mlRest.login(username, password).then(function (result) {
            if (result === 'success') {
              model.user.authenticated = true;
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
