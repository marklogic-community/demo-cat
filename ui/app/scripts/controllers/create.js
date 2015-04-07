(function () {
  'use strict';

  angular.module('demoCat')
    .filter('humanizeSize', function() {
      return function(input) {
        var result = '';
        if (input && typeof(input) === 'number') {
          if (input >= 1024 && input < 1048576) {
            result = (input / 1024).toFixed(1) + ' Kb';
          } else if (input >= 1048576 && input < 1073741824) {
            result = (input / 1048576).toFixed(1) + ' Mb';
          } else if (input >= 1073741824 && input < 1099511627776) {
            result = (input / 1073741824).toFixed(1) + ' Gb';
          } else {
            result = input + ' bytes';
          }
        }

        return result;
      };
    })
    .controller('CreateCtrl', CreateCtrl);

  CreateCtrl.$inject = ['$scope', 'domains', 'demoService', '$location', '$routeParams', 'edit', 'demo', 'features', 'technologies'];
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
          attachments: [],
          media: [],
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
        scriptFiles: [],
        featureChoices: features,
        technologyChoices: technologies,
        domainChoices: domains,
        browserChoices: ['Firefox', 'Chrome', 'IE', 'Safari'],
        personRoleChoices: ['Technical Contact', 'Business Owner', 'External Contact', 'Other'],
        statusChoices: ['Working', 'Not Working', 'In Development', 'Retired', 'Unknown'],
        formValid: false,
        formError: false
      };

      if (model.demo.demoStatus && model.demo.demoStatus.lastStatusTimestamp) {
        model.lastStatusTimestampPretty = new Date(model.demo.demoStatus.lastStatusTimestamp).toJSON();
      }

      angular.extend($scope, {
        model: model,
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
          if (model.featureToAdd && model.featureToAdd !== '' && model.demo.features.indexOf(model.featureToAdd) < 0) {
            model.demo.features.push(model.featureToAdd);
          }
          delete model.featureToAdd;
        },
        removeFeature: function(index) {
          model.demo.features.splice(index, 1);
        },
        addMediaLink: function() {
          model.demo.media.push({mediaUrl: null, mediaType: ''});
        },
        removeMediaLink: function(index) {
          model.demo.media.splice(index, 1);
        },
        addTechnology: function() {
          if (model.technologyToAdd && model.technologyToAdd !== '' && model.demo.technologies.indexOf(model.technologyToAdd) < 0) {
            model.demo.technologies.push(model.technologyToAdd);
          }
          delete model.technologyToAdd;
        },
        removeTechnology: function(index) {
          model.demo.technologies.splice(index, 1);
        },
        addDomain: function() {
          if (model.domainToAdd && model.domainToAdd !== '' && model.demo.domains.indexOf(model.domainToAdd) < 0) {
            model.demo.domains.push(model.domainToAdd);
          }
          delete model.domainToAdd;
        },
        removeDomain: function(index) {
          model.demo.domains.splice(index, 1);
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
        deleteAttachment: function(attachent, index) {
          demoService.deleteAttachment($routeParams.uri, attachent).then(
            function() {
              model.demo.attachments.splice(index, 1);
            }
          );
        },
        versionValid: versionValid,
        attachmentsValid: attachmentsValid,
        submit: function() {
          var promise;

          if ( !validate(model) || $scope.createForm.$invalid ) {
            model.formValid = false;
            model.formError = true;
            $('html, body').animate({ scrollTop: 0 });
            return;
          }

          if (edit) {
            promise = demoService.save(model.demo, model.scriptFiles, $routeParams.uri);
          }
          else {
            promise = demoService.create(model.demo, model.scriptFiles);
          }

          promise.then(function(response) {
            var uri = response.uri || $routeParams.uri;
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
      
      function validate(model) {
        return contactsValid(model.demo.persons) && versionValid(model.demo.version) && attachmentsValid(model.scriptFiles);
      }
      
      function contactsValid(field) {
        return (!isEmpty(field) && field.length > 0);
      }

      function versionValid(field) {
        return !isEmpty(field) && startsWithNumber(field);
      }
      
      function attachmentsValid(files) {
        var result = true;
        angular.forEach(files, function(file) {
          if (file.size > 5242880) {
            result = false;
          }
        });
        return result;
      }
      
      function isEmpty(field) {
        var result = (field === null || field === undefined || field === '');
        return result;
      }
      
      function startsWithNumber(field) {
        return field && field.match(/^\d/);
      }
      
    }
}());
