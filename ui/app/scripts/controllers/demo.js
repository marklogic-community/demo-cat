(function () {
  'use strict';

  angular.module('demoCat')
    .factory('DemoModel', DemoModel)
    .controller('DemoCtrl', DemoCtrl);

  function DemoModel() {
    var commentModel = {
      // set by model binding
      msg: '',
      // the values below are set server-side
      id: null,
      username: null,
      dateTime: null
    };

    var bugModel = {
      // set by model binding
      msg: '',
      browser: '',
      status: 'open',
      type: '',
      assignee: '',
      // the values below are set server-side
      id: null,
      username: null,
      dateTime: null
    };

    var model = {
      // your model stuff here
      demo: {
        comments: [],
        bugs: []
      },
      attachedMedia: [],
      // additional comment model used for new
      additionalComment: commentModel,
      additionalBug: bugModel,
      edit: '',
      // TODO We probably want only one place to edit browser choices
      browserChoices: ['Firefox', 'Chrome', 'IE'],
      bugChoices: ['defect', 'enhancement'],
      bugStatuses: ['open', 'closed'],
      users: [],
      editorOptions: {
        height: '100px',
        toolbarGroups: [
          { name: 'clipboard',   groups: [ 'clipboard', 'undo' ] },
          { name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ] },
          { name: 'paragraph', groups: [ 'list', 'indent', 'blocks', 'align', 'bidi' ] },
          { name: 'links' }
        ],
        //override default options
        toolbar: '',
        /* jshint camelcase: false */
        toolbar_full: '',
        followError: false
      }
    };
    return model;
  }

  DemoCtrl.$inject = ['$scope', 'MLRest', '$location', '$routeParams', 'demo', 'user', '$sce', 'ModalService', 'demoService', '$sanitize', 'DemoModel', 'youtubeEmbedUtils'];

  function DemoCtrl($scope, mlRest, $location, $routeParams, demo, user, $sce, modal, demoService, $sanitize, model, youtubeEmbedUtils) {
    var uri = $routeParams.uri;
    model.uri = $routeParams.uri;
    model.user = user;
    model.attachedMedia = [];

    if (demo) {
      var imageExtensions = ['jpeg','jpg','gif','png'];
      var videoExtensions = ['webm','ogg','mp4'];
      var applicationExtensions = ['pdf'];
      var mediaExtensions = _.flatten([imageExtensions,videoExtensions,applicationExtensions]);
      model.demo = angular.extend({media:[]},demo);
      angular.forEach(model.demo.attachments, function(attachment) {
        var extension = attachment.uri.replace(/^.*\.([^\.]+)$/, '$1');
        if (mediaExtensions.indexOf(extension) > -1) {
          var mediaType;
          if (imageExtensions.indexOf(extension) > -1) {
            mediaType =  'image';
          } else if (videoExtensions.indexOf(extension) > -1) {
            mediaType =  'video';
          } else {
            mediaType = 'application';
          }
          model.attachedMedia.push({
            mediaName: attachment.attachmentName,
            mediaUrl: '/demo/attachment?uri='+attachment.uri,
            mediaType: mediaType,
            contentType: mediaType + '/' + extension,
            mediaHeight: '600px'
          });
        }
      });
      angular.forEach(model.demo.bugs, function(bug, index) {
        if (! bug.nr) {
          bug.nr = index + 1;
        }
      });
    } else {
      model.demo = {
        comments: [],
        bugs: []
      };
      model.attachedMedia = [];
    }

    model.media = model.attachedMedia.concat(model.demo.media);

    angular.extend($scope, {
      model: model,

      deleteDemo: function() {
        modal
        .show('/views/modals/confirmation.html', 'Confirm', {text:'Are you sure you wish to delete this demo?'})
        .then(function(){
          demoService['delete'](model.uri).then(function(){
            $location.url('/');
          });
        });
      },

      showBugForm: false,

      showClosedBugs: false,

      saveField: function(field, value) {
        var content = {};
        content[field] = value;
        mlRest.patch(
          uri,
          {
            'patch': [
              {
                'replace-insert': {
                  'select': '$.' + field,
                  'content': content,
                  'context': '$',
                  'position': 'last-child'
                }
              }
            ]
          }
        );
        model.edit = '';
      },

      // call to add to an array field
      //
      addToField: function(field, value, finalFunction) {
        $scope.insertField('.' + field,value,'last-child',finalFunction);
      },

      // this adds a field to a doc
      insertField: function(pathFromDoc, value, position, finalFunction) {
          mlRest.patch(
            uri,
            {
              'patch': [
                {
                  'insert': {
                    'context': '$' + pathFromDoc,
                    'position': position,
                    'content': value
                  }
                }
              ]
            }
          ).finally(finalFunction);
        },

      deleteItem: function(type, array, id) {
        var item = null;
        var index = 0;
        angular.forEach(array, function(a, i) {
          if (a.id === id) {
            item = a;
            index = i;
          }
        });
        if (item) {
          // delete item from server
          mlRest.callExtension(type,
            {
              method: 'DELETE',
              params: {
                'rs:uri': uri,
                'rs:id': item.id
              },
              headers: {
                'Content-Type': 'application/json'
              }
            }
          )
          .then(
            function() {
              array.splice(index, 1);
            }
          );
        }
      },

      addBug: function(bug) {
        // add bugs array if it doesn't exist
        // this is for demos created before adding bugs
        if (typeof $scope.model.demo.bugs === 'undefined') {
          //$scope.insertField('', {'bugs':[]},'last-child');
          $scope.model.demo.bugs = [];
        }
        var max = $scope.model.demo.bugs.length;
        angular.forEach($scope.model.demo.bugs, function(bug) {
          if (bug.nr > max) {
            max = bug.nr;
          }
        });
        bug.nr = max + 1;
        // send bug to server
        // reset the bug form after the bug is sent
        mlRest.callExtension('file-bug',
          {
            method: 'POST',
            data: bug,
            params: {
              'rs:uri': uri
            },
            headers: {
              'Content-Type': 'application/json'
            }
          }
        ).then(
          function(result){
            $scope.addToDemoArray('bugs',result.data);
            $scope.resetBugForm();
          }
        );
      },

      addComment: function(comment) {
        // add comments array if it doesn't exist
        // this is for demos created before adding comments
        if (typeof $scope.model.demo.comments === 'undefined') {
          $scope.insertField('', {'comments':[]},'last-child');
          $scope.model.demo.comments = [];
        }
        // send comment to server
        // reset the comment form after the comment is sent
        mlRest.callExtension('comment',
          {
            method: 'POST',
            data: comment,
            params: {
              'rs:uri': uri
            },
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
          .then($scope.resetCommentForm);
      },

      updateItemInArray: function(extensionName, itemId, propertyName, propertyValue) {
        // make call to extension with item id
        mlRest.callExtension(extensionName,
          {
            method: 'PUT',
            data: { 'value':propertyValue },
            params: {
              'rs:uri': uri,
              'rs:id': itemId,
              'rs:property':propertyName
            },
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      },

      addToDemoArray: function(arrayName, item) {
        $scope.model.demo[arrayName].push(item);
      },

      resetCommentForm: function(result) {
        // add the comment to the demo model to update UI
        $scope.addToDemoArray('comments', result.data);
        $scope.model.additionalComment.msg = '';
      },

      resetBugForm: function() {
        $scope.model.additionalBug.msg = '';
        $scope.model.additionalBug.browser = '';
        $scope.model.additionalBug.type = '';
        $scope.model.additionalBug.assignee = '';
      },

      // Get a list of the users in the system
      populateUsers: function() {
        // Only attempt to get the list once.
        if ($scope.model.users.length <= 0) {
          mlRest.callExtension('user-list',
            {
              method: 'GET',
              data: '',
              params: {
              },
              headers: {
                'Content-Type': 'application/json'
              }
            }
          ).then(
            function(response){
              var result = response.data;
              // Modify the list and put the currentUser in the first position, as requested in #51
              var currentUser = $scope.model.user.name;
              result = $.grep(result, function(value) {
                return value !== currentUser;
              });
              result.unshift(currentUser);

              $scope.model.users = result;
            }
          );
        }
      },

      addMemo: function() {
        var memo = { title: null, body: null };
        modal
        .show('/views/modals/edit-memo.html', 'New memo', memo, validateMemo)
        .then(function(memo) {
          if (!model.demo.memos) {
            model.demo.memos = [];
          }
          memo.body = $sanitize(memo.body);
          model.demo.memos.push(memo);
          saveMemos(memo);
        });
      },
      showMemo: function(memo) {
        modal
        .show('/views/modals/show-memo.html', 'View memo', memo)
        .then(function(memo){
          modal
          .show('/views/modals/edit-memo.html', 'Edit memo', memo, validateMemo)
          .then(function(memo){
            memo.body = $sanitize(memo.body);
            saveMemos();
          });
        });
      },
      removeMemo: function(index) {
        model.demo.memos.splice(index, 1);
        saveMemos();
      },
      isFollowing: function() {
        var pos = model.user.follows.map(function(e) { return e.followUri; }).indexOf(model.uri);
        if(pos > -1 ) {
          return true;
        }
        else {
          return false;
        }

      },
      follow: function() {
        // Only allow the user to follow if they have set an email in their profile
        if(model.user.emails && model.user.emails.length > 0){
          mlRest.callExtension('follow',
            {
              method: 'POST',
              data: '',
              params: {
                'rs:uri': uri
              },
              headers: {
                'Content-Type': 'application/json'
              }
            }
          ).then(
            function(result) {
              // TODO: Check result
              model.user.follows.push(result.data);
              model.followError = false;
            }
          );
        }
        else {
          model.followError = true;
        }

      },
      unfollow: function() {
        mlRest.callExtension('follow',
          {
            method: 'DELETE',
            data: '',
            params: {
              'rs:uri': uri
            },
            headers: {
              'Content-Type': 'application/json'
            }
          }
        ).then(
          function(result) {
            var toDelete = model.user.follows.map(function(e) { return e.followUri; }).indexOf(model.uri);
            if(toDelete > -1) {
              model.user.follows.splice(toDelete, 1);
            }
          }
        );
      },
      showMediaModal: function (media) {
        modal
        .show('/views/modals/show-media.html', 'Media Viewer', media, null, { windowClass: 'democat-media-modal-window'});
      },
      trustUrl: $sce.trustAsResourceUrl,
      youTubeThumbnail: function(ytUrl) {
        return $sce.trustAsResourceUrl('//img.youtube.com/vi/' + youtubeEmbedUtils.getIdFromURL(ytUrl) + '/default.jpg');
      }
    });

    function validateMemo(memo) {
      var alerts = [];
      if (! memo.title) {
        alerts.push('Title is required');
      }
      if (! memo.body) {
        alerts.push('Body is required');
      }
      return alerts;
    }

    function saveMemos(memo) {
      demoService.save(model.demo, null, uri);
    }

  }
}());
