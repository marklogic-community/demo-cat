'use strict';

describe('Directive: features', function () {
  var $scope,
      $element;

  beforeEach(module('demoCat', 'scripts/directives/features.html'));

  beforeEach(inject( function($templateCache, _$compile_, _$rootScope_) {
    var tmpl = '<div>' + $templateCache.get('scripts/directives/features.html') + '</div>',
        $compile = _$compile_,
        $rootScope = _$rootScope_;

    $scope = $rootScope;

    $scope.featureChoices = {
      list: ['blue', 'green'],
      optFeature: '',
      selFeature: ''
    };
    $scope.editFeatures = ['black'];

    $element = $compile(tmpl)($scope);
  }));

  it('should show list when mode="view"', function () {
    $scope.mode = 'view';
    $scope.$digest();

    expect( $( $element ).find('ul') ).not.toHaveClass('ng-hide');
    expect( $( $element ).find('div.features-edit') ).toHaveClass('ng-hide');
  });

  it('should show edit-form when mode="edit"', function () {
    $scope.mode = 'edit';
    $scope.$digest();

    expect( $( $element ).find('ul') ).toHaveClass('ng-hide');
    expect( $( $element ).find('div.features-edit') ).not.toHaveClass('ng-hide');
  });

  it('should show cancel/save when mode="edit" and editType="inline"', function () {
    $scope.mode = 'edit';
    $scope.editType = 'inline';
    $scope.$digest();

    expect( $( $element ).find('.inline-controls') ).not.toHaveClass('ng-hide');
  });

  //TODO: get this working
  it('should add selected feature', function () {
    console.log('initial state:');
    console.log($scope.editFeatures);

    $scope.mode = 'edit';
    $scope.featureChoices.optFeature = 'blue';
    $scope.$digest();

    //NOTE: link() method in directive is never called!
    //scope methods are undefined
    //$scope.addFeature();

    //data is properly updated in the DOM
    console.log('bound selection:');
    console.log( $( $element ).find('.selected-feature').val() );

    //but this appears to do nothing
    $( $element ).find('.add-feature').trigger('click');

    //bound feature spans are not updated
    console.log('bound display:');
    console.log( $( $element ).find('.feature .ng-binding').html() );

    //features list is unchanged
    console.log('final state:');
    console.log($scope.editFeatures);

    //expect( $scope.editFeatures.indexOf('blue') > 1 ).toBe(true);
  });

});
