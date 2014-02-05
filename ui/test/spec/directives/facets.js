'use strict';

describe('Facet directive', function () {
  var $compile, $rootScope;

  var facetTmpl = '<facet ng-model="model.facets"';

  beforeEach(module('demoCat'));

  beforeEach(inject(function(_$compile_, _$rootScope_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
  }));

  it(' should create facet list element', function () {
    var $scope = $rootScope.$new();
    // The passing a template into $ compile returns a "linking" function that can
    // be used to take a scope and apply it to the template
    var $element = $compile(facetTmpl)($scope);
    // Now the actual test
    expect($element.html()).toContain('class="facet-list"');
  });

});
