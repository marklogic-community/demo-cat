'use strict';

describe('User service', function () {
  var user = null;
  var $httpBackend = null;

  beforeEach(module('demoCat'));

  beforeEach(inject(function ($injector) {
    user = $injector.get('User');
    $httpBackend = $injector.get('$httpBackend');

  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('creates a user model by default', function() {
    $httpBackend.expect('GET', '/user/status')
      .respond(
        200,
        {
          'authenticated': false
        });

    $httpBackend.flush();

    expect(user.name).toEqual('');
    expect(user.password).toEqual('');
    expect(user.loginError).toBe(false);
    expect(user.authenticated).toBe(false);
    expect(user.hasProfile).toBe(false);
    expect(user.fullname).toEqual('');
    expect(user.emails).toEqual([]);

  });

  it('updates the user model from the status call', function() {
    $httpBackend.expect('GET', '/user/status')
      .respond(
        200,
        {
          'authenticated': true,
          'username': 'test',
          'profile': {
            'fullname': 'Test',
            'emails': ['test@marklogic.com']
          }
        });

    $httpBackend.flush();

    expect(user.name).toEqual('test');
    expect(user.password).toEqual('');
    expect(user.loginError).toBe(false);
    expect(user.authenticated).toBe(true);
    expect(user.hasProfile).toBe(true);
    expect(user.fullname).toEqual('Test');
    expect(user.emails).toEqual(['test@marklogic.com']);

  });

});
