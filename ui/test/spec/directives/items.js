'use strict';

describe('Directive: items', function () {
  var scope, element;

  beforeEach(module('demoCat', 'app-templates'));

  beforeEach(inject( function($compile, $rootScope) {
    element = '<items edit-items="model.demo.features" item-choices="model.featureChoices" edit-type="inline" mode="view"/>';
    element = $compile(element)($rootScope);
    $rootScope.$digest();
    scope = element.isolateScope();

    angular.extend(scope, {
      itemChoices: {
        list: ['blue', 'green'],
        optItem: '',
        selItem: ''
      },
      editItems: ['black']
    });

  }));

  it('should show list when mode="view"', function () {
    scope.mode = 'view';
    scope.$digest();

    expect( $( element ).find('ul') ).not.toHaveClass('ng-hide');
    expect( $( element ).find('div.items-edit') ).toHaveClass('ng-hide');
  });

  it('should show edit-form when mode="edit"', function () {
    scope.mode = 'edit';
    scope.$digest();

    expect( $( element ).find('ul') ).toHaveClass('ng-hide');
    expect( $( element ).find('.items-edit') ).not.toHaveClass('ng-hide');
  });

  it('should show cancel/save when mode="edit" and editType="inline"', function () {
    scope.mode = 'edit';
    scope.editType = 'inline';
    scope.$digest();

    expect( $( element ).find('.inline-controls') ).not.toHaveClass('ng-hide');
  });

  it('should add selected item', function () {
    scope.mode = 'edit';
    scope.itemChoices.optItem = 'blue';
    $( element ).find('.add-item').trigger('click');
    scope.$digest();

    expect( scope.editItems.indexOf('blue') > -1 ).toBe(true);
  });

  it('should add new item', function () {
    scope.mode = 'edit';
    scope.itemChoices.selItem = 'pink';
    $( element ).find('.add-item').trigger('click');
    scope.$digest();

    expect( scope.editItems.indexOf('pink') > -1 ).toBe(true);
  });

});
