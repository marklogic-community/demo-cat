(function() {
  'use strict';
  angular.module('demoCat.home', []);
  angular.module('demoCat.home')
    .filter('timezone', function() {
      return function(timezone) {
        if (timezone === 0) {
          return 'Z';
        } else {
          return (timezone > 0 ? '+' : '-') + ('0' + Math.floor(Math.abs(timezone))).slice(-2) + ':' + ('0' + (Math.abs(timezone) * 60) % 60).slice(-2);
        }
      };
    })
    .factory('HomeModel', [
      function() {
        return {
          user: null,
          vanguard: null,
          donttouch: null,
          spotlight: null
        };
      }
    ])
    .controller('HomeCtrl', ['HomeModel', '$scope', '$modal', '$sce', 'user', 'users', 'demos', 'MLRest', 'demoService', '$filter',
      function(model, $scope, $modal, $sce, user, users, demos, mlRest, demoService, $filter) {
        model.user = user;
        angular.extend($scope, {
          model: model,
          editVanguard: editVanguard,
          editDontTouch: editDontTouch,
          editSpotlight: editSpotlight
        });

        var vanguardBaseline = {
          'news': [],
          'services': []
        };
        mlRest.getDocument('/vanguard.json', {
          format: 'json'
        }).then(function(response) {
          model.vanguard = angular.extend(vanguardBaseline, response.data.vanguard);
        }, function() {
          model.vanguard = vanguardBaseline;
        });
        if (!model.donttouch) {
          mlRest.getDocument('/dont-touch.json', {
            format: 'json'
          }).then(function(response) {
            var now = new Date();
            var donttouch = response.data['dont-touch'] || [];
            angular.forEach(donttouch, function(event, index) {
              event.start = new Date(event.start);
            });
            // automatically remove past events
            donttouch = donttouch.filter(function(event) {
              if (event.start > now) {
                return event;
              }
            });
            model.donttouch = donttouch;
          },
          function() {
            model.donttouch = [];
          });
        }
        if (!model.spotlight) {
          mlRest.getDocument('/spotlight.json', {
            format: 'json'
          }).then(function(response) {
            model.spotlight = response.data.spotlight || [];
          },
          function() {
            model.spotlight = [];
          });
        }

        function editVanguard() {
          var vanguard = angular.copy(model.vanguard);
          showModal('/views/modals/edit-vanguard.html', 'Edit Vanguard', {
            vanguard: vanguard,
            addVanguardNewsLink: function() {
              vanguard.news.push({});
            },
            removeVanguardNewsLink: function(index) {
              vanguard.news.splice(index, 1);
            },
            addVanguardServicesLink: function() {
              vanguard.services.push({});
            },
            removeVanguardServicesLink: function(index) {
              vanguard.services.splice(index, 1);
            }
          }).then(function() {
            model.vanguard = vanguard;
            mlRest.updateDocument({
              vanguard: model.vanguard
            }, {
              uri: '/vanguard.json',
              format: 'json'
            });
          });
        }

        function editDontTouch() {
          var donttouch = angular.copy(model.donttouch);
          var isOpen = donttouch.map(function() {
            return false;
          });
          showModal('/views/modals/edit-dont-touch.html', 'Edit Don\'t Touch', {
            donttouch: donttouch,
            clientTimezone: new Date().getTimezoneOffset() / -60,
            users: users,
            demos: demos,
            addDontTouchLink: function() {
              donttouch.push({
                presenter: user.fullname ? user.fullname : user.name,
                start: new Date(),
                duration: 60
              });
            },
            removeDontTouchLink: function(index) {
              donttouch.splice(index, 1);
            },
            isOpen: isOpen,
            toggleCalendar: function(e, i) {
              e.preventDefault();
              e.stopPropagation();

              isOpen[i] = !isOpen[i];
            }
          }).then(function() {
            angular.forEach(donttouch, function(event, index) {
              var demo = demos.filter(function(demo) {
                return demo.name === event.demo;
              });
              if (demo.length > 0) {
                event.uri = demo[0].uri;
              }
              if (!event.title) {
                event.title = event.demo;
              }
            });
            model.donttouch = donttouch;
            mlRest.updateDocument({
              'dont-touch': model.donttouch
            }, {
              uri: '/dont-touch.json',
              format: 'json'
            });
          });
        }

        function editSpotlight() {
          var spotlight = angular.copy(model.spotlight);
          var demoName = null;
          var attachments = [];
          showModal('/views/modals/edit-spotlight.html', 'Edit Spotlight', {
            spotlight: spotlight,
            demos: demos,
            attachments: function(name, value) {
              if (demoName === name) {
                return $filter('filter')(attachments, value);
              } else {
                demoName = name;
                var demo = demos.filter(function(demo) {
                  return demo.name === name;
                });
                if (demo.length > 0) {
                  return demoService.get(demo[0].uri).then(function(demo) {
                    attachments = demo.attachments;
                    return $filter('filter')(demo.attachments, value);
                  });
                } else {
                  attachments = [];
                  return attachments;
                }
              }
            },
            addSpotlightLink: function() {
              spotlight.push({});
            },
            removeSpotlightLink: function(index) {
              spotlight.splice(index, 1);
            }
          }).then(function() {
            angular.forEach(spotlight, function(spot, index) {
              var demo = demos.filter(function(demo) {
                return demo.name === spot.demo;
              });
              if (demo.length > 0) {
                spot.uri = demo[0].uri;
              }
              var attachment = attachments.filter(function(attachment) {
                return attachment.attachmentName === spot.attachment;
              });
              if (attachment.length > 0) {
                spot.src = attachment[0].uri;
              }
              if (!spot.title) {
                spot.title = spot.demo;
              }
            });
            model.spotlight = spotlight;
            mlRest.updateDocument({
              spotlight: model.spotlight
            }, {
              uri: '/spotlight.json',
              format: 'json'
            });
          });
        }

        function showModal(template, title, model, validate) {
          return $modal.open({
            templateUrl: template + '',
            controller: function($scope, $modalInstance, title, model, validate, user) {
              $scope.title = title;
              $scope.model = model;
              $scope.user = user;
              $scope.alerts = [];
              $scope.ok = function() {
                if (validate) {
                  $scope.alerts = validate($scope.model);
                }
                if (!$scope.modal.$invalid && $scope.alerts.length === 0) {
                  $modalInstance.close($scope.model);
                }
              };
              $scope.cancel = function() {
                $modalInstance.dismiss('cancel');
              };
              $scope.encodeURIComponent = encodeURIComponent;
              $scope.trustUrl = $sce.trustAsResourceUrl;
            },
            size: 'lg',
            resolve: {
              title: function() {
                return title;
              },
              model: function() {
                return model;
              },
              validate: function() {
                return validate;
              },
              user: function() {
                return user;
              }
            }
          }).result;
        }
      }
    ]);
}());
