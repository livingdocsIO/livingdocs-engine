Focus = require('../../../src/interaction/focus')

describe 'Focus', ->

  describe 'constructor()', ->

    it 'sets up its properties as undefined', ->
      focus = new Focus()
      expect(focus.snippetView).to.be.undefined
      expect(focus.editableNode).to.be.undefined


  describe 'focus', ->
    beforeEach ->
      @focus = new Focus()
      @snippetView = test.getTemplate('title').createView()
      @editable = @snippetView.directives['editable'][0].elem


    it 'focuses a snippet view', ->
      @focus.snippetFocused(@snippetView)
      expect(@focus.snippetView).to.equal(@snippetView)
      expect(@focus.editableNode).to.be.undefined


    it 'focuses an editable', ->
      @focus.editableFocused(@editable)
      expect(@focus.snippetView).to.equal(@snippetView)
      expect(@focus.editableNode).to.equal(@editable)


    it 'blurs an editable', ->
      @focus.editableFocused(@editable)
      @focus.editableBlurred(@editable)
      expect(@focus.snippetView).to.equal(@snippetView)
      expect(@focus.editableNode).to.be.undefined


    it 'blurs everything', ->
      @focus.editableFocused(@editable)
      @focus.blur()
      expect(@focus.snippetView).to.be.undefined
      expect(@focus.editableNode).to.be.undefined


  describe 'events', ->
    beforeEach ->
      @focus = new Focus()
      @snippetView = test.getTemplate('title').createView()


    it 'fires snippetFocus()', (done) ->
      @focus.snippetFocus.add (snippetView) =>
        expect(snippetView).to.equal(@snippetView)
        done()

      @focus.snippetFocused(@snippetView)


    it 'does not fire snippetFocus() a second time for the same snippet', ->
      eventSpy = sinon.spy(@focus.snippetFocus, 'fire')
      @focus.snippetFocused(@snippetView)
      @focus.snippetFocused(@snippetView)
      expect(eventSpy.callCount).to.equal(1)


    it 'fires snippetBlur()', (done) ->
      @focus.snippetFocused(@snippetView)

      @focus.snippetBlur.add (snippetView) =>
        expect(snippetView).to.equal(@snippetView)
        done()

      @focus.blur()


    it 'does not fire snippetBlur() when noting is selected', ->
      eventSpy = sinon.spy(@focus.snippetBlur, 'fire')
      @focus.blur()
      expect(eventSpy.callCount).to.equal(0)
