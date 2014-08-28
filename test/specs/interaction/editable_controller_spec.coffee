EditableController = require('../../../src/interaction/editable_controller')

describe 'editableController', ->

  # Helpers
  # -------

  triggerEditableEvent = (eventName, args...) ->
    func = @withContext(this[eventName])
    func.apply(this, args)


  # Spec
  # ----

  beforeEach ->
    { @renderer, @snippetTree } = getInstances('page', 'renderer')

    @editableController = new EditableController(@renderer.renderingContainer)
    @editableController.triggerEditableEvent = triggerEditableEvent
    @editable = @editableController.editable


  describe 'selection event', ->

    beforeEach ->
      @title = test.getTemplate('title').createView()
      @elem = @title.$html[0]


    it 'fires and finds snippet event', ->
      foundSnippet = undefined

      @editableController.selection.add (snippet, element, selection) ->
        foundSnippet = snippet
        expect.element

      @editableController.triggerEditableEvent('selectionChanged', @elem, undefined)
      expect(foundSnippet.model).to.equal(@title.model)


  describe 'enter event', ->

    beforeEach ->
      @title = test.createSnippet('title', 'A')
      @snippetTree.append(@title)


    it 'inserts a second element', ->
      @editableController.insert(@title.createView())
      expect(@snippetTree.toJson().content.length).to.equal(2)


    it 'inserts the default paragraph element', ->
      expect(@snippetTree.design.paragraphSnippet).to.equal('text')
      @editableController.insert(@title.createView())
      expect(@renderer.snippetTree.toJson().content[1].identifier).to.equal('test.text')


    it 'inserts the paragraph snippet defined by the design', ->
      @snippetTree.design.paragraphSnippet = 'title'
      @editableController.insert(@title.createView())
      expect(@renderer.snippetTree.toJson().content[1].identifier).to.equal('test.title')
