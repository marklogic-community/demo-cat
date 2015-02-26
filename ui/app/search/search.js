'use strict';
angular.module('demoCat.search', [])
  .filter('searchsummary', function() {
    return function(input) {
      var t = '';
      if (input.shortdesc && input.shortdesc.values && input.shortdesc.values.length) {
        t = input.shortdesc.values[0];
      } else if (input.description && input.description.values && input.description.values.length) {
        // it's likely rich html so we need to get text only
        var dummydiv = window.jQuery('<div></div>').html(input.description.values[0]);
        t = dummydiv.text().substring(0,95);
      }
      return t;
    };
  });
