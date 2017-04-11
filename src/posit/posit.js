angular.module('cjm.directives.posit', [])
  /* Usage:
   **   <div cjm-posit>
   **   <div cjm-posit="childHandleSelector">
   **
   ** Optional Attributes:
   **
   **   cjm-posit-bounding-parent: Bounds this posit by parent rect
   **   cjm-posit-bounding-id:     Bounds this posit by id
   **
   */
  .directive('cjmPosit', ['$document', '$window', function($document, $window) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        var startX;
        var startY;
        var x = 0;
        var y = 0;
        var container = false;

        element.css({
          position: 'absolute',
          whiteSpace: 'nowrap'
        });

        var handleElem = false;
        if(attrs.cjmPosit) {
          handleElem = angular.element(element[0].querySelector(attrs.cjmPosit));
        }

        if(handleElem[0]) {
          handleElem.css({
            cursor: 'move'
          });
          handleElem.on('mousedown', beginMove);
        } else {
          element.css({
            cursor: 'move'
          });
          element.on('mousedown', beginMove);
        }

        function beginMove($event) {
          if(!angular.element($event.target).hasClass('no-posit')) {
            $event.preventDefault();
            getBoundingContainer();
            x = element[0].offsetLeft;
            y = element[0].offsetTop;
            startX = $event.pageX - x;
            startY = $event.pageY - y;
            $document.on('mousemove', doMove);
            $document.on('mouseup', endMove);
          }
        }

        function doMove($event) {
          x = $event.pageX - startX;
          y = $event.pageY - startY;
          setPosition();
        }

        function endMove() {
          $document.off('mousemove', doMove);
          $document.off('mouseup', endMove);
        }

        function getBoundingContainer() {
          var boundingElement;
          container = false;
          if(attrs.cjmPositBoundingParent !== undefined) {
            boundingElement = angular.element(element[0].parentElement);

            container = {
              left: 0,
              top: 0,
              width: boundingElement[0].offsetWidth,
              height: boundingElement[0].offsetHeight,
              right: boundingElement[0].offsetWidth,
              bottom: boundingElement[0].offsetHeight
            };

          } else if(attrs.cjmPositBoundingId) {
            boundingElement = angular.element(document.getElementById(attrs.cjmPositBoundingId));
            var boundToAncestor = false;
            var absoluteAncestor = false;
            var absoluteOffsetX = 0;
            var absoluteOffsetY = 0;
            if(boundingElement) {
              var ancestorElement = element;
              while (ancestorElement[0].parentElement && !boundToAncestor) {
                ancestorElement = angular.element(ancestorElement[0].parentElement);
                if(ancestorElement[0].id === attrs.cjmPositBoundingId) {
                  boundToAncestor = true;
                }
                if($window.getComputedStyle(ancestorElement[0], null).getPropertyValue('position') === 'absolute') {
                  absoluteAncestor = true;
                  absoluteOffsetX += ancestorElement[0].offsetLeft;
                  absoluteOffsetY += ancestorElement[0].offsetTop;
                }
              }

              if(boundToAncestor) {
                container = {
                  left: boundingElement[0].offsetLeft - absoluteOffsetX,
                  top: boundingElement[0].offsetTop - absoluteOffsetY,
                  width: boundingElement[0].offsetWidth,
                  height: boundingElement[0].offsetHeight,
                  right: 0,
                  bottom: 0
                };
              } else {
                var rectBounding = boundingElement[0].getBoundingClientRect();
                container = {
                  left: rectBounding.left - absoluteOffsetX + window.scrollX,
                  top: rectBounding.top - absoluteOffsetY + window.scrollY,
                  width: boundingElement[0].offsetWidth,
                  height: boundingElement[0].offsetHeight,
                  right: 0,
                  bottom: 0
                };
              }
              container.right = container.left + container.width;
              container.bottom = container.top + container.height;
            }
          }
        }

        function setPosition() {
          var width = element[0].offsetWidth;
          var height = element[0].offsetHeight;

          if(container) {

            if(x < container.left || width > container.width) {
              x = container.left;
            } else if(container.right < x + width) {
              x = container.right - width;
            }

            if(y < container.top || height > container.height) {
              y = container.top;
            } else if(container.bottom < y + height) {
              y = container.bottom - height;
            }
          }

          element.css({
            top: y + 'px',
            left: x + 'px'
          });
        }

        if(attrs.cjmPositBoundingParent !== undefined || attrs.cjmPositBoundingId) {
          getBoundingContainer();
          x = element[0].offsetLeft;
          y = element[0].offsetTop;
          setPosition(); // set the initial position of the element within the bounds
        }
      }
    };
  }]);
