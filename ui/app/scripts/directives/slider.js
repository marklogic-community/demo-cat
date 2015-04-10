var sliderApp=angular.module('sliderApp',['ngAnimate']);

sliderApp.controller('SliderController', function($scope) {
    'use strict';

    $scope.images=[{src:'situational-wareness-sm.png',title:'Situational Awareness'},{src:'ediscovery-sm.png',title:'eDiscovery'},{src:'dmlchealthcare-sm.png',title:'DMLC Healthcare'},{src:'obi-sm.png',title:'OBI'}]; 
});
 
sliderApp.directive('slider', function ($timeout) {
    'use strict';

  return {
    restrict: 'AE',
    replace: true,
    scope:{
        images: '='
    },
    link: function (scope, elem, attrs) {
    
        scope.currentIndex=0;

        scope.next=function(){
            scope.currentIndex<scope.images.length-1?scope.currentIndex++:scope.currentIndex=0;
        };
        
        scope.prev=function(){
            scope.currentIndex>0?scope.currentIndex--:scope.currentIndex=scope.images.length-1;
        };
        
        scope.$watch('currentIndex',function(){
            scope.images.forEach(function(image){
                image.visible=false;
            });
            scope.images[scope.currentIndex].visible=true;
        });
        
        /* Start: For Automatic slideshow*/
        
        var timer;
        
        var sliderFunc=function(){
            timer=$timeout(function(){
                scope.next();
                timer=$timeout(sliderFunc,5000);
            },5000);
        };
        
        sliderFunc();
        
        scope.$on('$destroy',function(){
            $timeout.cancel(timer);
        });
        
        /* End : For Automatic slideshow*/
        angular.element(document.querySelectorAll('.arrow')).one('click',function(){
            $timeout.cancel(timer);
        });
    },
    templateUrl:'scripts/directives/slider.html'
  };
});