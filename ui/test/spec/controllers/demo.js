'use strict';

describe('Controller: DemoCtrl', function () {
  var $httpBackend, $rootScope, $scope, createController, mlRest, user, routeParams;

  var demoModel =
    {
      name: '',
      description: '',
      host: '',
      hostType: 'internal',
      browsers: [],
      features: [],
      domains: [],
      languages: [],
      comments: [],
      bugs: []
    };

  beforeEach(function() {
    module('demoCat');
  });
  // Initialize the controller and a mock scope
  beforeEach(inject(function ($injector) {
    // Set up the mock http service responses
    $httpBackend = $injector.get('$httpBackend');
    $httpBackend.when('GET', '/v1/documents?format=json').respond(200,demoModel,{'Content-Type':'application/json'});
    $httpBackend.when('GET', '/user/status')
      .respond(
        200,
        {
          'authenticated':true,
          'username':'test',
          'profile':{
            'fullname': 'Test',
            'emails':['test@marklogic.com']
          }
        });
    // Get hold of a scope (i.e. the root scope)
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    mlRest = $injector.get('MLRest');
    user = $injector.get('User');
    routeParams = $injector.get('$routeParams');
    // The $controller service is used to create instances of controllers
    var $controller = $injector.get('$controller');

    createController = function() {
      return $controller('DemoCtrl', {
        '$scope': $scope,
        'MLRest': mlRest,
        'features': {},
        'domains': {},
        'User': user,
        '$routeParams': routeParams
      });
    };
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should add bug', function() {
    // backend definition for adding bug
    $httpBackend.when('POST', '/v1/resources/file-bug')
      .respond(function(method, url, data) { return [200, data, {'Content-Type':'application/json'}]; });
    createController();
    $httpBackend.flush();
    $scope.addBug({'msg': 'Status won\'t update', 'browser':'IE', 'status':'open', 'type':'defect'});
    $httpBackend.flush();
    expect($scope.model.demo.bugs.length).toBe(1);
    expect($scope.model.demo.bugs[0].msg).toBe('Status won\'t update');
    expect($scope.model.demo.bugs[0].status).toBe('open');
    expect($scope.model.demo.bugs[0].type).toBe('defect');
    //testing adding a second bug
    $scope.addBug({'msg': 'Page won\'t load', 'browser':'Chrome', 'status':'closed', 'type':'enhancement'});
    $httpBackend.flush();
    expect($scope.model.demo.bugs.length).toBe(2);
    expect($scope.model.demo.bugs[1].msg).toBe('Page won\'t load');
    expect($scope.model.demo.bugs[1].status).toBe('closed');
    expect($scope.model.demo.bugs[1].type).toBe('enhancement');
  });


  it('should add comment', function() {
    // backend definition for adding comment
    $httpBackend.when('POST', '/v1/resources/comment')
      .respond(function(method, url, data) { return [200, data, {'Content-Type':'application/json'}]; });
    createController();
    $httpBackend.flush();
    $scope.addComment({'msg': 'This was a great demo'});
    $httpBackend.flush();
    expect($scope.model.demo.comments.length).toBe(1);
    expect($scope.model.demo.comments[0].msg).toBe('This was a great demo');
    //testing adding a second comment
    $scope.addComment({'msg': 'This demo was even better than the first time'});
    $httpBackend.flush();
    expect($scope.model.demo.comments.length).toBe(2);
    expect($scope.model.demo.comments[1].msg).toBe('This demo was even better than the first time');
  });
});
