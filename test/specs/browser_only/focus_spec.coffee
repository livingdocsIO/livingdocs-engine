Focus = require('../../../src/interaction/focus')

describe '(browser only) focus:', ->

  describe 'constructor()', ->

    it 'sets up its properties as undefined', ->
      focus = new Focus()
      expect(focus.componentView).to.be.undefined
      expect(focus.editableNode).to.be.undefined


  describe 'focus', ->
    beforeEach ->
      @focus = new Focus()
      @componentView = test.getTemplate('title').createView()
      @editable = @componentView.directives['editable'][0].elem


    it 'focuses a component view', ->
      @focus.componentFocused(@componentView)
      expect(@focus.componentView).to.equal(@componentView)
      expect(@focus.editableNode).to.be.undefined


    it 'focuses an editable', ->
      @focus.editableFocused(@editable)
      expect(@focus.componentView).to.equal(@componentView)
      expect(@focus.editableNode).to.equal(@editable)


    it 'blurs an editable', ->
      @focus.editableFocused(@editable)
      @focus.editableBlurred(@editable)
      expect(@focus.componentView).to.equal(@componentView)
      expect(@focus.editableNode).to.be.undefined


    it 'blurs everything', ->
      @focus.editableFocused(@editable)
      @focus.blur()
      expect(@focus.componentView).to.be.undefined
      expect(@focus.editableNode).to.be.undefined


  describe 'events', ->
    beforeEach ->
      @focus = new Focus()
      @componentView = test.getTemplate('title').createView()


    it 'fires componentFocus()', (done) ->
      @focus.componentFocus.add (componentView) =>
        expect(componentView).to.equal(@componentView)
        done()

      @focus.componentFocused(@componentView)


    it 'does not fire componentFocus() a second time for the same component', ->
      eventSpy = sinon.spy(@focus.componentFocus, 'fire')
      @focus.componentFocused(@componentView)
      @focus.componentFocused(@componentView)
      expect(eventSpy.callCount).to.equal(1)


    it 'fires componentBlur()', (done) ->
      @focus.componentFocused(@componentView)

      @focus.componentBlur.add (componentView) =>
        expect(componentView).to.equal(@componentView)
        done()

      @focus.blur()


    it 'does not fire componentBlur() when nothing is selected', ->
      eventSpy = sinon.spy(@focus.componentBlur, 'fire')
      @focus.blur()
      expect(eventSpy.callCount).to.equal(0)


    describe 'for containers', ->

      beforeEach ->
        @container = test.getTemplate('container').createView()
        @componentInContainer = test.getTemplate('image').createView()
        @container.model.containers.default.append(@componentInContainer)


      it 'fires containerFocus()', (done) ->
        @focus.containerFocus.add (container, event) ->
          expect(container).to.equal(@container)
          expect(event.target).to.equal(@componentInContainer)
          done()

        @focus.componentFocused(@componentInContainer)


      it 'bubbles up to the root container', (done) ->
        callCount = 0
        @focus.containerFocus.add (container, event) ->
          callCount += 1
          if callCount == 2
            # TODO expect root
            expect(event.target).to.equal(@componentInContainer)
            done()

        @focus.componentFocused(@componentInContainer)


      it 'fires containerBlur()', (done) ->
        @focus.componentFocused(@componentInContainer)
        @focus.containerBlur.add (container, event) ->
          expect(container).to.equal(@container)
          done()
        @focus.componentFocused(@componentView)


      it 'fires containerFocus() after componentFocus()', (done) ->
        componentFocusWasCalled = false
        @focus.componentFocus.add (componentView) =>
          expect(componentView).to.equal(@componentInContainer)
          componentFocusWasCalled = true
        @focus.containerFocus.add (container, event) ->
          expect(componentFocusWasCalled).to.be.true
          done()
        @focus.componentFocused(@componentInContainer)


      it 'fires containerBlur() after componentBlur()', ->
        componentBlurWasCalled = false
        @focus.componentFocused(@componentInContainer)
        @focus.componentBlur.add (componentView) =>
          expect(componentView).to.equal(@componentView)
          componentBlurWasCalled = true
        @focus.containerBlur.add (container, event) ->
          expect(componentBlurWasCalled).to.be.true
        @focus.componentFocused(@componentView)
