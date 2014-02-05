'use strict';

describe('Controller: CreateCtrl', function () {

  // load the controller's module
  beforeEach(module('demoCat'));

  var CreateCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    CreateCtrl = $controller('CreateCtrl', {
      $scope: scope
    });
  }));

  it('should add a feature only once', function () {
    scope.model.selFeature = 'foo';
    scope.addFeature();
    expect(scope.model.features.length).toBe(1);
    scope.model.selFeature = 'foo';
    scope.addFeature();
    expect(scope.model.features.length).toBe(1);
  });

  it('should add multiple features', function () {
    scope.model.selFeature = 'foo';
    scope.addFeature();
    expect(scope.model.features.length).toBe(1);
    scope.model.selFeature = 'bar';
    scope.addFeature();
    expect(scope.model.features.length).toBe(2);
  });

  it('should remove features', function() {
    scope.model.features = ['a', 'b', 'c'];
    scope.removeFeature('a');
    expect(scope.model.features.length).toBe(2);
    expect(scope.model.features[0]).toBe('b');
    expect(scope.model.features[1]).toBe('c');
  });
});
