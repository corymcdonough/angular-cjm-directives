'use strict';
describe('subwindowBoundingService', function() {
  // var subwindowBoundingService;

  // load the module and services we want to test
  beforeEach(function() {
    module('asw.subwindow.bounding');
    module('asw.subwindow.posit');
  });

  describe('asw.subwindow.posit', function() {
    var element;
    var scope;
    beforeEach(inject(function($rootScope) {
      scope = $rootScope.$new();
    }));

    it('should add an event to the handle', inject(function($compile) {
      var e = jQuery.Event('mousedown');
      e.target = element;
      e.preventDefault = sinon.spy();

      element = $compile('<div asw-posit></div>')(scope);
      scope.$apply();
      element.trigger(e);

      expect(e.preventDefault.called).to.equal(true);
    }));
  });
});
