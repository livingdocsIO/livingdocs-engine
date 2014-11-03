Focus = require('../../../src/interaction/focus')

describe 'Focus', ->

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


    it 'focuses a snippet view', ->
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


    it 'does not fire componentFocus() a second time for the same snippet', ->
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


    it 'does not fire componentBlur() when noting is selected', ->
      eventSpy = sinon.spy(@focus.componentBlur, 'fire')
      @focus.blur()
      expect(eventSpy.callCount).to.equal(0)
