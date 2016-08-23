(function () {
  'use strict';

  angular.module('demoCat')
    .directive('pdf', function() {
      return {
        restrict: 'E',
        link: function(scope, element, attrs) {
          var data = ' data="' + scope.$eval(attrs.src) + '"';
          var type = attrs.type ? (' type="' + scope.$eval(attrs.type) + '"') : '';
          var height = attrs.height ? (' height="' + scope.$eval(attrs.height) + '"') : '';
          var width = attrs.width ? (' width="' + scope.$eval(attrs.width) + '"') : '';
          element.append('<div class="row"><object class="col-sm-12" ' + height + width + type + data + '></object></div>');
        }
      };
    });

}());
