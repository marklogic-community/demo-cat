angular.module('sliderApp', [])
  .directive('slider', function($timeout) {
    'use strict';

    return {
      restrict: 'AE',
      replace: true,
      scope: {
        orgImages: '=images',
        uriPrefix: '@',
        imagePrefix: '@'
      },
      link: function(scope, elem, attrs) {

        // initialization
        scope.currentIndex = 0;
        scope.isRunning = true;
        scope.showOverlap = false;
        scope.delay = 5000;
        
        scope.images = [];

        function toggleImage(index) {
          scope.images[index].visible = !scope.images[index].visible;
        }

        var next = function() {
          // hide current images
          toggleImage(scope.currentIndex);
          toggleImage(scope.currentIndex + 1);

          scope.currentIndex = (scope.currentIndex + (scope.showOverlap ? 1 : 2)) % scope.orgImages.length;

          // show new images
          toggleImage(scope.currentIndex);
          toggleImage(scope.currentIndex + 1);
        };

        var previous = function(item) {
          // hide current images
          toggleImage(scope.currentIndex);
          toggleImage(scope.currentIndex + 1);

          scope.currentIndex = (scope.currentIndex + scope.orgImages.length - (scope.showOverlap ? 1 : 2)) % scope.orgImages.length;

          // show new images
          toggleImage(scope.currentIndex);
          toggleImage(scope.currentIndex + 1);
        };
        
        /* Start: For Automatic slideshow*/
        var timer;

        var startTimer = function() {
          timer = $timeout(function() {
            next();
            timer = $timeout(startTimer, scope.delay);
          }, scope.delay);
        };

        scope.$on('$destroy', function() {
          $timeout.cancel(timer);
        });

        scope.pause = function() {
          scope.isRunning = false;
          $timeout.cancel(timer);
        };

        scope.play = function() {
          scope.isRunning = true;
          startTimer();
        };
        /* End : For Automatic slideshow*/
        
        // pause auto slide at user interaction
        scope.next = function() {
          scope.pause();
          next();
        };
        
        scope.previous = function(item) {
          scope.pause();
          previous(item);
        };
        
        // init
        scope.$watch('$parent.'+attrs.images, function(images) {
          if (images && images.length > 0) {
            scope.images = angular.copy(images);
            scope.images[images.length] = images[0];
            scope.images.map(function(image) {
              image.visible = false;
            });
            scope.images[scope.currentIndex].visible = true;
            scope.images[scope.currentIndex + 1].visible = true;
            if (scope.isRunning) {
              startTimer();
            }
          }
        });

      },
      templateUrl: 'scripts/directives/slider.html'
    };
  });
