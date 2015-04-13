var sliderApp=angular.module('sliderApp',[]);

sliderApp.controller('SliderController', function($scope) {
    'use strict';

    $scope.images=[
    {
        src:'situational-wareness-sm.png',
        title:'Situational Awareness',
        uri:'http://catalog.demo.marklogic.com/detail/demos/17784760062083407114.json',
        desc:'This is a short description.'
    },
    {
        src:'ediscovery-sm.png',
        title:'eDiscovery',
        uri:'http://catalog.demo.marklogic.com/detail/demos/5462875041093986835.json',
        desc:'A Day in the life of an investigator @CITI.'
    },
    {
        src:'dmlchealthcare-sm.png',
        title:'DMLC Healthcare',
        uri:'http://www.cnn.com',
        desc:'This is a short description.'
    },
    {
        src:'obi-sm.png',
        title:'OBI',
        uri:'https://wiki.marklogic.com/display/PUBLICSOLN/Backup+Object+Based+Intelligence',
        desc:'The MarkLogic OBP solution answers this challenge by providing tradecraft tools and a data model capable of storing, enhancing and disseminating high value analysis products. '
    },
    {
        src:'exec-paycheck.png',
        title:'Executive Paycheck',
        uri:'https://wiki.marklogic.com/display/CS/Media+Demo',
        desc:'This site collects information about executive compensation from SEC filings and presents them as an information application that lets users search, browse and analyse the data and gain insight into the pay structure of the Fortune 500.'
    }

    ]; 
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

        scope.pause=function(){
            $timeout.cancel(timer);
        };
        
        scope.play=function(){
            sliderFunc();
        };

        /* End : For Automatic slideshow*/
        angular.element(document.querySelectorAll('.arrow')).one('click',function(){
            $timeout.cancel(timer);
        });
    },
    templateUrl:'scripts/directives/slider.html'
  };
});