'use strict';
angular.module('demoCat.search', [])
  .filter('searchsummary', function() {
    return function(input) {
      var t = '';
      // make sure it has a non-empty short description value
      if (input.shortdesc) {
        t = input.shortdesc;
      } else {
        var desc = input.description || '';
        // it's likely rich html so we need to get text only
        var dummydiv = window.jQuery('<div></div>').html(desc);
        t = dummydiv.text();
        if (t.length > 95) {
          t = t.substring(0,95) + '...';
        }
      }
      return t;
    };
  });
