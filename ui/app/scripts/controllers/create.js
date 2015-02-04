(function () {
  'use strict';

  angular.module('demoCat')
    .controller('CreateCtrl', CreateCtrl);

  CreateCtrl.$inject = ['$scope', 'Domains', 'demoService', '$location', '$routeParams', 'edit', 'demo', 'features', 'technologies'];
  function CreateCtrl($scope, domains, demoService, $location, $routeParams, edit, demo, features, technologies) {
      var model = {
        demo: angular.extend({
          name: '',
          description: '',
          host: '',
          hostType: 'internal',
          restricted: false,
          restrictionDetails: '',
          demoStatus: {
            status: 'Working',
            statusDetails: '',
            lastStatusTimestamp: new Date().toJSON()
          },
          script: '',
          browsers: [],
          features: [],
          technologies: [],
          domains: [],
          languages: [],
          bugs: [],
          comments: [],
          credentials: [],
          persons: []
        }, demo),
        edit: edit,
        featureChoices: features,
        technologyChoices: technologies,
        domainChoices: domains.list(),
        browserChoices: ['Firefox', 'Chrome', 'IE'],
        personRoleChoices: ['Technical Contact', 'Business Owner', 'External Contact'],
        statusChoices: ['Working', 'Not Working', 'In Development', 'Retired', 'Unknown']
      };

      if (model.demo.demoStatus && model.demo.demoStatus.lastStatusTimestamp) {
        model.lastStatusTimestampPretty = new Date(model.demo.demoStatus.lastStatusTimestamp).toJSON();
      }

      angular.extend($scope, {
        model: model,
        scriptFile: [],
        editorOptions: {
          height: '100px'
        },
        updateBrowsers: function(browser) {
          var index = $scope.model.demo.browsers.indexOf(browser);
          if (index > -1) {
            $scope.model.demo.browsers.splice(index, 1);
          } else {
            $scope.model.demo.browsers.push(browser);
          }
        },
        addCredentials: function() {
          model.demo.credentials.push({username: null, password: null});
        },
        removeCredentials: function(index) {
          model.demo.credentials.splice(index, 1);
        },
        addFeature: function() {
          if (model.demo.features.indexOf(model.featureToAdd) < 0) {
            model.demo.features.push(model.featureToAdd);
          }
          delete model.featureToAdd;
        },
        removeFeature: function(index) {
          model.demo.features.splice(index, 1);
        },
        addTechnology: function() {
          if (model.demo.technologies.indexOf(model.technologyToAdd) < 0) {
            model.demo.technologies.push(model.technologyToAdd);
          }
          delete model.technologyToAdd;
        },
        removeTechnology: function(index) {
          model.demo.technologies.splice(index, 1);
        },
        addPerson: function() {
          model.demo.persons.push({personName: null, role: null, email: null});
        },
        removePerson: function(index) {
          model.demo.persons.splice(index, 1);
        },
        statusChanged: function() {
          model.demo.demoStatus.lastStatusTimestamp = new Date().toJSON();
        },
        submit: function() {
          var promise;
          if (edit) {
            promise = demoService.save(model.demo, model.scriptFile, $routeParams.uri);
          }
          else {
            promise = demoService.create(model.demo, model.scriptFile);
          }

          promise.then(function(response) {
            // var uri = response.data.href.replace(/(.*\?uri=)/, '');
            var uri = response.uri;//$routeParams.uri;
            $location.path('/detail' + uri);
          });
        },
        cancel: function() {
          if (edit) {
            $location.path('/detail' + $routeParams.uri);
          }
          else {
            $location.path('/');
          }
        }
      });

    }
}());
