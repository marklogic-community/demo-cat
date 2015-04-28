angular.module('sliderApp', [])
  .directive('slider', function($timeout) {
    'use strict';

    return {
      restrict: 'AE',
      replace: true,
      scope: {
        images: '=',
        uriPrefix: '@',
        imagePrefix: '@'
      },
      link: function(scope, elem, attrs) {

        // initialization
        scope.currentIndex = 0;
        scope.isRunning = true;
        scope.showOverlap = true;
        scope.delay = 5000;

        function toggleImages(index) {
          if (index > scope.images.length - 1) {
            index = 0;
          }
          scope.images[index].visible = !scope.images[index].visible;

          if (index === scope.images.length - 1) {
            scope.images[0].visible = !scope.images[0].visible;
          } else {
            scope.images[index + 1].visible = !scope.images[index + 1].visible;
          }
        }

        /* slow slide to the left 1 by 1. */
        var overlappingNext = function() {
          // hide current images
          toggleImages(scope.currentIndex);

          if (scope.currentIndex >= scope.images.length - 1) {
            scope.currentIndex = 0;
          } else {
            scope.currentIndex++;
          }

          // show new images
          toggleImages(scope.currentIndex);
        };

        var overlappingPrevious = function(item) {
          // hide current images
          toggleImages(scope.currentIndex);

          if (scope.currentIndex === 0) {
            scope.currentIndex = scope.images.length - 1;
          } else {
            scope.currentIndex--;
          }

          // show new images
          toggleImages(scope.currentIndex);
        };
        /* end slow slide to the left 1 by 1. */

        /* faster slide to the left 2 by 2. */
        var contiguousNext = function() {
          var imglen = (scope.images.length / 2) | 1;

          // hide current images
          toggleImages(scope.currentIndex * 2);

          // handle odd or even number of images
          if ((scope.images.length % 2 === 0 && scope.currentIndex === imglen - 1) ||
            (scope.images.length % 2 === 1 && scope.currentIndex === imglen)) {
            scope.currentIndex = 0;
          } else {
            scope.currentIndex++;
          }

          // show new images
          toggleImages(scope.currentIndex * 2);
        };

        var contiguousPrevious = function(item) {
          var imglen = (scope.images.length / 2) | 1;

          // hide current images
          toggleImages(scope.currentIndex * 2);


          if (scope.currentIndex === 0) {
            // handle odd or even number of images
            if (scope.images.length % 2 === 1) {
              scope.currentIndex = imglen;
            } else {
              scope.currentIndex = imglen - 1;
            }
          } else {
            scope.currentIndex--;
          }

          // show new images
          toggleImages(scope.currentIndex * 2);
        };
        /* end faster slide to the left 2 by 2. */
        
        /* Start: For Automatic slideshow*/
        var timer;

        var startTimer = function() {
          timer = $timeout(function() {
            if (scope.showOverlap) {
              overlappingNext();
            } else {
              contiguousNext();
            }
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
        scope.overlappingNext = function() {
          scope.pause();
          overlappingNext();
        };
        
        scope.overlappingPrevious = function(item) {
          scope.pause();
          overlappingPrevious(item);
        };
        
        scope.contiguousNext = function() {
          scope.pause();
          contiguousNext();
        };
        
        scope.contiguousPrevious = function(item) {
          scope.pause();
          contiguousPrevious(item);
        };
        
        // init
        if (scope.isRunning) {
          startTimer();
        }

      },
      templateUrl: 'scripts/directives/slider.html'
    };
  });
