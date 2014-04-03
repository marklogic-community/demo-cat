'use strict';

describe('Controller: DemoCtrl', function () {
  var DemoCtrl, scope, win, q;

  beforeEach(function() {
    var mljs;

    win = { location: { href: '' } };
    mljs = {
      createDocument: function () {
        var deferred = q.defer();
        deferred.resolve( '/v1/documents?uri=blah' );
        return deferred.promise;
      }
    };

    module('demoCat');
    module(function($provide) {
      $provide.value('$window', win);
      $provide.value('MLJS', mljs);
    });
  });

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($q, $controller, $rootScope) {
    scope = $rootScope.$new();
    q = $q;
    DemoCtrl = $controller('DemoCtrl', {
      $scope: scope
    });
  }));

  it('should add comment', function() {
    scope.addComment({'msg':'This was a great demo'});
    expect(scope.model.demo.comments.length).toBe(1);
    expect(scope.model.demo.comments[0].msg).toBe('This was a great demo');
	//testing adding a second comment
    scope.addComment({'msg':'This demo was even better than the first time'});
    expect(scope.model.demo.comments.length).toBe(2);
    expect(scope.model.demo.comments[0].msg).toBe('This demo was even better than the first time');
  });
});
