'use strict';

describe('Controller: CreateCtrl', function () {
  var CreateCtrl, scope, win, q;

  beforeEach(function() {
    var mljs, features;

    win = { location: { href: '' } };
    features = { list: jasmine.createSpy() };
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
      $provide.value('Features', features);
      $provide.value('MLJS', mljs);
    });
  });

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($q, $controller, $rootScope) {
    scope = $rootScope.$new();
    q = $q;
    CreateCtrl = $controller('CreateCtrl', {
      $scope: scope
    });
  }));

  it('should add a browser', function () {
    expect(scope.model.demo.browsers.length).toBe(0);
    scope.updateBrowsers('Netscape');
    expect(scope.model.demo.browsers.length).toBe(1);
  });

  it('should add multiple browsers', function () {
    scope.updateBrowsers('Netscape');
    expect(scope.model.demo.browsers.length).toBe(1);
    scope.updateBrowsers('Lynx');
    expect(scope.model.demo.browsers.length).toBe(2);
  });

  it('should remove browsers', function() {
    scope.model.demo.browsers = ['a', 'b', 'c'];
    scope.updateBrowsers('a');
    expect(scope.model.demo.browsers.length).toBe(2);
    expect(scope.model.demo.browsers[0]).toBe('b');
    expect(scope.model.demo.browsers[1]).toBe('c');
  });

  it('should set window location when submitted', function() {
    scope.submit();
    scope.$apply();
    expect(win.location.href).toEqual('/detail?uri=blah');
  })
});
