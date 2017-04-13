angular.module('cjm.directives.bounding', [])
  .factory('cjmBoundingService', ['$window', function($window) {
    return {
      getBoundingContainer(element, boundingElement, bInsideBorders, bInsidePadding) {
        var container = false;
        var boundToAncestor = false;
        var absoluteOffsetX = 0;
        var absoluteOffsetY = 0;
        var borderPadding = {
          left: 0,
          width: 0,
          top: 0,
          height: 0
        };

        bInsideBorders = bInsideBorders || true;
        bInsidePadding = bInsidePadding || false;

        if(boundingElement) {
          var ancestorElement = element;
          while(ancestorElement[0].parentElement && !boundToAncestor) {
            ancestorElement = ancestorElement.parent();
            if(ancestorElement[0] === boundingElement[0]) {
              boundToAncestor = true;
            }
            if($window.getComputedStyle(ancestorElement[0], null).getPropertyValue('position') === 'absolute') {
              absoluteOffsetX += ancestorElement[0].offsetLeft;
              absoluteOffsetY += ancestorElement[0].offsetTop;
            }
          }

          if(bInsideBorders || bInsidePadding) {
            var computedStyles = $window.getComputedStyle(boundingElement[0], null);

            if(bInsideBorders) {
              var leftBorder = parseInt(computedStyles.getPropertyValue('border-left-width'), 10);
              var topBorder = parseInt(computedStyles.getPropertyValue('border-top-width'), 10);
              borderPadding.left += leftBorder;
              borderPadding.width += leftBorder + parseInt(computedStyles.getPropertyValue('border-right-width'), 10);
              borderPadding.top += topBorder;
              borderPadding.height += topBorder + parseInt(computedStyles.getPropertyValue('border-bottom-width'), 10);
            }

            if(bInsidePadding) {
              var leftPadding = parseInt(computedStyles.getPropertyValue('padding-left'), 10);
              var topPadding = parseInt(computedStyles.getPropertyValue('padding-top'), 10);
              borderPadding.left += leftPadding;
              borderPadding.width += leftPadding + parseInt(computedStyles.getPropertyValue('padding-right'), 10);
              borderPadding.top += topPadding;
              borderPadding.height += topPadding + parseInt(computedStyles.getPropertyValue('padding-bottom'), 10);
            }
          }

          if(boundToAncestor) {
            container = {
              left: boundingElement[0].offsetLeft - absoluteOffsetX + borderPadding.left,
              top: boundingElement[0].offsetTop - absoluteOffsetY + borderPadding.top,
              width: boundingElement[0].offsetWidth - borderPadding.width,
              height: boundingElement[0].offsetHeight - borderPadding.height,
              right: 0,
              bottom: 0
            };
          } else {
            var rectBounding = boundingElement[0].getBoundingClientRect();
            container = {
              left: rectBounding.left - absoluteOffsetX + $window.scrollX + borderPadding.left,
              top: rectBounding.top - absoluteOffsetY + $window.scrollY + borderPadding.top,
              width: boundingElement[0].offsetWidth - borderPadding.width,
              height: boundingElement[0].offsetHeight - borderPadding.height,
              right: 0,
              bottom: 0
            };
          }
          container.right = container.left + container.width;
          container.bottom = container.top + container.height;
        }

        return container;
      }
    };
  }]);
