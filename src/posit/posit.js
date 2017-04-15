angular.module('asw.subwindow.posit', ['asw.subwindow.bounding'])
  /* Usage:
   **   <div asw-posit>
   **   <div asw-posit="childHandleSelector">
   **
   ** Optional Attributes:
   **
   **   asw-posit-bounding-parent: Bounds this posit by parent rect
   **   asw-posit-bounding-id:     Bounds this posit by id
   **
   */
  .directive('aswPosit', ['$document', 'subwindowBoundingService', function($document, $bounding) {
    return {
      restrict: 'A',
      link(scope, element, attrs) {
        var startX;
        var startY;
        var x = 0;
        var y = 0;
        var boundingElement = false;
        var container = false;

        element.css({
          position: 'absolute',
          whiteSpace: 'nowrap'
        });

        var handleElem = false;
        if(attrs.aswPosit) {
          handleElem = angular.element(element[0].querySelector(attrs.aswPosit));
        }

        if(attrs.aswPositBoundingParent !== undefined) {
          boundingElement = angular.element(element[0].parentElement);
        } else if(attrs.aswPositBoundingId) {
          var elemById = $document[0].getElementById(attrs.aswPositBoundingId);
          if(elemById) {
            boundingElement = angular.element(elemById);
          }
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
            if(boundingElement) {
              container = $bounding.getBoundingContainer(element, boundingElement);
            }
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

        function setPosition() {
          var width = element[0].offsetWidth;
          var height = element[0].offsetHeight;

          if(container) {
            if(x < container.left || width > container.width) {
              x = container.left - 1;
            } else if(container.right < x + width) {
              x = container.right - width;
            }

            if(y < container.top || height > container.height) {
              y = container.top - 1;
            } else if(container.bottom < y + height) {
              y = container.bottom - height;
            }
          }

          element.css({
            top: `${y}px`,
            left: `${x}px`
          });
        }

        if(boundingElement) {
          container = $bounding.getBoundingContainer(element, boundingElement);
          x = element[0].offsetLeft;
          y = element[0].offsetTop;
          setPosition(); // set the initial position of the element within the bounds
        }
      }
    };
  }]);
