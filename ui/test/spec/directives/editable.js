'use strict';

describe('Directive: editable', function () {
  var scope, element;

  beforeEach(module('demoCat', 'app-templates'));

  beforeEach(inject( function($compile, $rootScope) {
    element = '<editable edit-model="model.demo.username" edit-type="text"/>';
    scope = $rootScope.$new();
    element = $compile(element)(scope);
  }));

  it('should show span when mode="view"', function () {
    scope.mode = 'view';
    scope.$digest();

    expect( $( element ).find('span') ).not.toHaveClass('ng-hide');
    expect( $( element ).find('div') ).toHaveClass('ng-hide');
  });

  it('should show input when mode="edit" and editType="text"', function () {
    scope.mode = 'edit';
    scope.editType = 'text';
    scope.$digest();

    expect( $( element ).find('input') ).not.toHaveClass('ng-hide');
  });

  it('should show textarea when mode="edit" and editType="textarea"', function () {
    scope.mode = 'edit';
    scope.editType = 'textarea';
    scope.$digest();

    expect( $( element ).find('textarea') ).not.toHaveClass('ng-hide');
  });

});
