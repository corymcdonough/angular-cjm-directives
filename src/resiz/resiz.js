angular.module('asw.subwindow.resiz', ['asw.subwindow.bounding'])
  /* Usage:
   **   <div asw-resiz>
   **   <div asw-resiz="childHandleSelector">
   **
   ** Optional Attributes:
   **
   **   asw-resiz-bounding-parent: Bounds this resiz by parent rect
   **   asw-resiz-bounding-id:     Bounds this resiz by id
   **
   */
  .directive('aswResiz', ['$window', '$document', 'subwindowBoundingService', function($window, $document, $bounding) {
    return {
      restrict: 'A',
      link(scope, element, attrs) {
        // variables for tracking the minimum allowable size
        var minWidth = 0;
        var minHeight = 0;
        var unmodifiedWidth = element[0].offsetWidth;
        var unmodifiedHeight = element[0].offsetHeight;
        // variables to calculate offset of movement from initial position/size
        var startWidth;
        var startHeight;
        var startX;
        var startY;
        var startPageY;
        // variables to keep track of current position/size
        var width = 0;
        var height = 0;
        var x = 0;
        var y = 0;
        var curPageY;
        var changeSize = 0;
        // variables to keep track of what changed and need to be updated
        var preResizeWidth;
        var preResizeHeight;
        var preResizeX;
        var preResizeY;
        var preResizePageY;
        // variables that track which sides can be resized
        var isResizeAll = false;
        var isResizeSouth = false;
        var isResizeEast = false;
        var isResizeNorth = false;
        var isResizeWest = false;

        var handleElem = false;
        var boundingElement = false;
        var container = false;

        if(attrs.aswResiz) {
          handleElem = angular.element(element[0].querySelector(attrs.aswResiz));
        }

        if(attrs.aswResizBoundingParent !== undefined) {
          boundingElement = angular.element(element[0].parentElement);
        } else if(attrs.aswResizBoundingId) {
          var elemById = $document[0].getElementById(attrs.aswResizBoundingId);
          if(elemById) {
            boundingElement = angular.element(elemById);
          }
        }

        if(!handleElem[0]) {
          handleElem = angular.element('<span class="glyphicon glyphicon-resize-small resiz-handle no-posit"></span>');
          element.append(handleElem);
          isResizeEast = true;
          isResizeSouth = true;
        } else {
          var resizeCursor = $window.getComputedStyle(handleElem[0], null).getPropertyValue('cursor');
          if(resizeCursor) {
            if(resizeCursor === 'all-scroll') {
              isResizeAll = true;
            } else {
              resizeCursor = resizeCursor.split('-');
              if(resizeCursor[1] === 'resize') {
                if(resizeCursor[0] === 'row' || resizeCursor[0] === 'col') {
                  getUnknownResize(resizeCursor[0]);
                }
                setResizeDirections(resizeCursor[0]);
              } else {
                getUnknownResize();
              }
            }
          }
        }

        handleElem.on('mousedown', beginResize);

        function getUnknownResize(resizeLimits) {
          resizeLimits = resizeLimits || 'any';
          if(resizeLimits === 'any' || resizeLimits === 'row') {
            var handleCenterEW = handleElem[0].offsetLeft + handleElem[0].offsetWidth / 2;
            var differentialEW = element[0].offsetWidth - handleCenterEW;
            var thirdWidth = element[0].offsetWidth / 3;
            if(differentialEW < thirdWidth) {
              isResizeEast = true;
            } else if(differentialEW > 2 * thirdWidth) {
              isResizeWest = true;
            } else {
              isResizeEast = true;
              isResizeWest = true;
            }
          }

          if(resizeLimits === 'any' || resizeLimits === 'col') {
            var handleCenterNS = handleElem[0].offsetTop + handleElem[0].offsetHeight / 2;
            var differentialNS = element[0].offsetHeight - handleCenterNS;
            var thirdHeight = element[0].offsetHeight / 3;
            if(differentialNS < thirdHeight) {
              isResizeSouth = true;
            } else if(differentialNS > 2 * thirdHeight) {
              isResizeNorth = true;
            } else {
              isResizeSouth = true;
              isResizeNorth = true;
            }
          }

          if(isResizeEast && isResizeWest && isResizeNorth && isResizeSouth) {
            isResizeEast = isResizeWest = isResizeNorth = isResizeSouth = false;
            isResizeAll = true;
          }
        }

        function setResizeDirections(resizeDirection) {
          var handleCenterEW = handleElem[0].offsetLeft + handleElem[0].offsetWidth / 2;
          var handleCenterNS = handleElem[0].offsetTop + handleElem[0].offsetHeight / 2;

          switch (resizeDirection) {
          case 'nesw':
            if(element[0].offsetHeight - handleCenterNS > element[0].offsetWidth / 2) {
              isResizeNorth = true;
              isResizeEast = true;
            } else {
              isResizeSouth = true;
              isResizeWest = true;
            }
            break;
          case 'nwse':
            if(element[0].offsetHeight - handleCenterNS > element[0].offsetWidth / 2) {
              isResizeNorth = true;
              isResizeWest = true;
            } else {
              isResizeEast = true;
              isResizeSouth = true;
            }
            break;
          case 'ew':
            if(element[0].offsetWidth - handleCenterEW > element[0].offsetWidth / 2) {
              isResizeWest = true;
            } else {
              isResizeEast = true;
            }
            break;
          case 'ns':
            if(element[0].offsetHeight - handleCenterNS > element[0].offsetWidth / 2) {
              isResizeNorth = true;
            } else {
              isResizeSouth = true;
            }
            break;
          }
        }

        function beginResize(event) {
          event.preventDefault();
          if(boundingElement) {
            container = $bounding.getBoundingContainer(element, boundingElement);
          }
          width = element[0].offsetWidth;
          height = element[0].offsetHeight;
          x = element[0].offsetLeft;
          y = element[0].offsetTop;
          curPageY = 0;
          if(isResizeAll) {
            startPageY = event.pageY;
          } else {
            if(isResizeEast) {
              startWidth = event.pageX - width;
            }
            if(isResizeSouth) {
              startHeight = event.pageY - height;
            }
            if(isResizeWest) {
              startX = event.pageX - x;
            }
            if(isResizeNorth) {
              startY = event.pageY - y;
            }
          }

          $document.on('mousemove', doResize);
          $document.on('mouseup', endResize);
        }

        function doResize(event) {
          preResizeX = x;
          preResizeY = y;
          preResizeWidth = width;
          preResizeHeight = height;
          preResizePageY = curPageY;
          if(isResizeAll) {
            curPageY = event.pageY - startPageY;
            changeSize = preResizePageY - curPageY;
            if(changeSize !== 0) {
              width += changeSize * 2;
              height += changeSize * 2;
              x -= changeSize;
              y -= changeSize;
            }
          } else {
            if(isResizeEast) {
              width = event.pageX - startWidth;
            }
            if(isResizeSouth) {
              height = event.pageY - startHeight;
            }
            if(isResizeWest) {
              x = event.pageX - startX;
            }
            if(isResizeNorth) {
              y = event.pageY - startY;
            }
          }

          setSize();
        }

        function endResize() {
          $document.off('mousemove', doResize);
          $document.off('mouseup', endResize);
        }

        function getMinimums() {
          if(attrs.aswResizMinWidthHeight !== undefined) {
            if(!attrs.aswResizMinWidthHeight) {
              defaultMinWidth();
              defaultMinHeight();
            } else if(typeof attrs.aswResizMinWidthHeight === 'string') {
              var minWidthHeight = attrs.aswResizMinWidthHeight.split('x');
              minWidth = Math.max(parseInt(minWidthHeight[0], 10), 0);
              minHeight = Math.max(parseInt(minWidthHeight[1], 10), 0);
            }
          } else {
            if(attrs.aswResizMinWidth !== undefined) {
              if(!attrs.aswResizMinWidth) {
                defaultMinWidth();
              } else {
                minWidth = Math.max(attrs.aswResizMinWidth, 0);
              }
            }

            if(attrs.aswResizMinHeight !== undefined) {
              if(!attrs.aswResizMinHeight) {
                defaultMinHeight();
              } else {
                minHeight = Math.max(attrs.aswResizMinHeight, 0);
              }
            }
          }
        }

        function defaultMinWidth() {
          var cssMinWidth = element.css('min-width');
          if(cssMinWidth) {
            minWidth = Math.max(parseInt(cssMinWidth, 10), 0);
          } else {
            minWidth = Math.max(unmodifiedWidth, 0);
          }
        }

        function defaultMinHeight() {
          var cssMinHeight = element.css('min-height');

          if(cssMinHeight) {
            minHeight = Math.max(parseInt(cssMinHeight, 10), 0);
          } else {
            minHeight = Math.max(unmodifiedHeight, 0);
          }
        }

        function setSize(overrideToAll) {
          getMinimums();

          if(isResizeAll || overrideToAll) {
            clampResizeAll();
          } else {
            if(isResizeEast) {
              clampResizeE();
            }
            if(isResizeSouth) {
              clampResizeS();
            }
            if(isResizeWest) {
              clampResizeW();
            }
            if(isResizeNorth) {
              clampResizeN();
            }
          }

          if(width !== preResizeWidth) {
            element.css({
              width: `${width}px`
            });
          }

          if(height !== preResizeHeight) {
            element.css({
              height: `${height}px`
            });
          }

          if(x !== preResizeX) {
            element.css({
              left: `${x}px`
            });
          }

          if(y !== preResizeY) {
            element.css({
              top: `${y}px`
            });
          }


          function clampResizeAll() {
            if(container) {
              if(x + width > container.right) {
                x = container.right - width;
              }
              if(x < container.left) {
                x = container.left;
                if(x + width > container.right) {
                  width = container.right - x;
                }
              }

              if(y + height > container.bottom) {
                y = container.bottom - height;
              }
              if(y < container.top) {
                y = container.top;
                if(y + height > container.bottom) {
                  height = container.bottom - y;
                }
              }
            }

            width = Math.max(width, minWidth);
            height = Math.max(height, minHeight);

            if(changeSize < 0) {
              if(width === minWidth) {
                x = preResizeX;
              }
              if(height === minHeight) {
                y = preResizeY;
              }
            }
          }

          function clampResizeE() {
            if(container) {
              if(x + width < container.left) {
                width = container.left - x;
              } else if(x + width > container.right) {
                width = container.right - x;
              }
            }
            width = Math.max(width, minWidth);
          }

          function clampResizeW() {
            if(container) {
              if(x < container.left) {
                x = container.left;
              } else if(x > container.right) {
                x = container.right;
                width += preResizeX - x;
              } else {
                width += preResizeX - x;
              }

              if(width < minWidth) {
                width = minWidth;
                x = preResizeX;
              }
            }
          }

          function clampResizeS() {
            if(container) {
              if(y + height < container.top) {
                height = container.top - y;
              } else if(y + height > container.bottom) {
                height = container.bottom - y;
              }
            }
            height = Math.max(height, minHeight);
          }

          function clampResizeN() {
            if(container) {
              if(y < container.top) {
                y = container.top;
              } else if(y > container.bottom) {
                y = container.bottom;
                height += preResizeY - y;
              } else {
                height += preResizeY - y;
              }

              if(height < minHeight) {
                height = minHeight;
                y = preResizeY;
              }
            }
          }
        }
      }
    };
  }]);
