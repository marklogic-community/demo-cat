(function () {
  'use strict';

  angular.module('demoCat')
    .controller('DemoCtrl', ['$scope', 'MLRest', 'Features', 'User', '$routeParams', function ($scope, mlRest, features, user, $routeParams) {
      var uri = $routeParams.uri;
      var commentModel = 
        {
          // set by model binding
          msg:'',
          // the values below are set server-side
          username: null,
          dateTime: null
        };
      var model = {
        // your model stuff here
        demo: {
          comments:[]
        },
        // additional comment model used for new 
        additionalComment: commentModel,
        edit: '',
        featureChoices: features.list(),
        user: user // GJo: a bit blunt way to insert the User service, but seems to work
      };

      mlRest.getDocument(uri, { format: 'json' }).then(function(data) {
        model.demo = data;
      });
      
      angular.extend($scope, {
        model: model,

        saveField: function(field, value) {
          mlRest.patch(
            uri,
            {
              'patch': [
                {
                  'replace': {
                    'select': '$.' + field,
                    'content': value
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
    
        addComment: function(comment) {
          // add comments array if it doesn't exist
          // this is for demos created before adding comments
          if (typeof $scope.model.demo.comments === 'undefined') {
            $scope.insertField('', {'comments':[]},'last-child');
            $scope.model.demo.comments = [];
          }
          // send comment to server
          // reset the comment form after the comment is sent
          mlRest.addComment(uri, comment)
            .then($scope.resetCommentForm);
        },
        
        resetCommentForm: function(result) {
          // add the comment to the demo model to update UI
          $scope.model.demo.comments.push(result);
          $scope.model.additionalComment.msg = '';
        }
      });
    }]);
}());
