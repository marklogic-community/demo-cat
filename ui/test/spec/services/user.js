'use strict';

describe('User', function () {
  var user = null;

  beforeEach(module('demoCat'));

  beforeEach(function () {
    var $injector = angular.injector([ 'demoCat' ]);
    user = $injector.get('User');
  });

  it('creates a user model by default', function() {
    var validPropNames = ["name", "password", "loginError", "authenticated", "hasProfile", "fullname", "emails", "init"];
    
    //console.log(user);
    
    // check for valid props
    for (var i in validPropNames) {
      var prop = validPropNames[i];
      //console.log("user["+prop+"]="+(user[prop]!==undefined));
      expect( user[prop] ).not.toBe( undefined );
    }
    
    // check for invalid props
    for (var prop in user) {
      var i = $.inArray(prop, validPropNames);
      //console.log(prop+"="+i);
      expect( i ).not.toBe( -1 );
    }
  });

});
