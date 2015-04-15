var sliderApp=angular.module('sliderApp',[]);

sliderApp.controller('SliderController', function($scope) {
    'use strict';

    $scope.images=[
    {
        src:'situational-wareness-sm.png',
        title:'Situational Awareness',
        uri:'http://catalog.demo.marklogic.com/detail/demos/17784760062083407114.json',
        desc:'This is a short description.',
        visible: true
    },
    {
        src:'ediscovery-sm.png',
        title:'eDiscovery',
        uri:'http://catalog.demo.marklogic.com/detail/demos/5462875041093986835.json',
        desc:'A Day in the life of an investigator @CITI.',
        visible: true
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
    },
    {
        src:'blue-fusion.png',
        title:'Blue Fusion',
        uri:'#',
        desc:'MarkLogic Blue Fusion is an integrated software solution that can be deployed at headquarters, forward operating bases, 2-man carry transit cases, and simple laptop computers.'
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

        function toggleImages(index) {
            if (index > scope.images.length - 1) { 
                index=0;
            }
            scope.images[ index ].visible = !scope.images[ index ].visible;
    
            if (index === scope.images.length - 1) { 
                scope.images[0].visible = !scope.images[0].visible;
                } else {
                scope.images[ index + 1 ].visible = !scope.images[ index + 1 ].visible;
                }
        }

        /* a different scroll pattern. */
        /*
        function overlappingNext() {
            toggleImages( scope.currentIndex );
    
            if (scope.currentIndex >= scope.images.length - 1) {
                scope.currentIndex = 0;
            } else {
                scope.currentIndex++;
            }
    
            toggleImages( scope.currentIndex );
        }

        function overlappingPrevious(item) {
            toggleImages( scope.currentIndex );

            if (scope.currentIndex === 0) {
                scope.currentIndex = scope.images.length - 1;
            } else {
                scope.currentIndex--;
            }       
    
            toggleImages( scope.currentIndex );
        }
        */
        /* end a different scroll pattern*/ 
        scope.contiguousNext=function() {
            var imglen = (scope.images.length / 2)|1;
    
            toggleImages( scope.currentIndex * 2 );
    
            // handle odd or even number of images
            if ( (scope.images.length % 2 === 0 && scope.currentIndex === imglen - 1) ||
                (scope.images.length % 2 === 1 && scope.currentIndex === imglen) ) {
                    scope.currentIndex = 0;
            } else {
                scope.currentIndex++;
            }
    
            toggleImages( scope.currentIndex * 2 );
        };

        scope.contiguousPrevious=function(item) {
            var imglen = (scope.images.length / 2)|1;
    
            toggleImages( scope.currentIndex * 2 );
        

            if ( scope.currentIndex === 0 ) {
                // handle odd or even number of images
                if (scope.images.length % 2 === 1) {
                    scope.currentIndex = imglen;
                } else {
                    scope.currentIndex = imglen - 1;
                }
            } else {
                scope.currentIndex--;
            }
        
            toggleImages( scope.currentIndex * 2 );
        };

        /* Start: For Automatic slideshow*/
        
        var timer;
        
        var sliderFunc=function(){
            timer=$timeout(function(){
                scope.contiguousNext();
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