'use strict';
angular.module('demoCat.search', [])
  .filter('searchsummary', function() {
    return function(input) {
      var t = '';
      // make sure it has a non-empty short description value
      if (input.shortdesc && input.shortdesc.values && input.shortdesc.values.length && input.shortdesc.values[0]) {
        t = input.shortdesc.values[0];
      } else {

        var desc = (input.description && input.description.values && input.description.values[0]) || '';
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
