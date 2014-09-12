(function () {
  'use strict';

  angular.module('demoCat')
    .controller('DemoCtrl',
      ['$scope', 'MLRest', 'Features', 'Domains', 'User', '$routeParams',
      function ($scope, mlRest, features, domains, user, $routeParams) {
      var uri = $routeParams.uri;
      var commentModel =
        {
          // set by model binding
          msg:'',
          // the values below are set server-side
          id: null,
          username: null,
          dateTime: null
        };
      var bugModel =
        {
          // set by model binding
          msg:'',
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
          comments:[],
          bugs:[]
        },
        // additional comment model used for new
        additionalComment: commentModel,
        additionalBug: bugModel,
        edit: '',
        featureChoices: features.list(),
        domainChoices: domains.list(),
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
          toolbar_full: ''
        },
        user: user // GJo: a bit blunt way to insert the User service, but seems to work
      };

      mlRest.getDocument(uri, { format: 'json' }).then(function(response) {
        model.demo = response.data;
      });

      angular.extend($scope, {
        model: model,

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

        deleteItem: function(type, item) {
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
            .then(function() {item = null;});
        },

        addBug: function(bug) {
          // add bugs array if it doesn't exist
          // this is for demos created before adding bugs
          if (typeof $scope.model.demo.bugs === 'undefined') {
            $scope.insertField('', {'bugs':[]},'last-child');
            $scope.model.demo.bugs = [];
          }
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
              $scope.addToDemoArray('bugs',result);
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
          $scope.addToDemoArray('comments',result);
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
                  function(result){
                    // Modify the list and put the currentUser in the first position, as requested in #51
                    var currentUser = $scope.model.user.fullname;
                    result = $.grep(result, function(value) {
                      return value !== currentUser;
                    });
                    result.unshift(currentUser);

                    $scope.model.users = result;
                  }
                );
          }
        }


      });
    }]);
}());
