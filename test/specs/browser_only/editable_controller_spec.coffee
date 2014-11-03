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
    { @renderer, @componentTree } = getInstances('page', 'renderer')

    @editableController = new EditableController(@renderer.renderingContainer)
    @editableController.triggerEditableEvent = triggerEditableEvent
    @editable = @editableController.editable


  describe 'selection event', ->

    beforeEach ->
      @title = test.getTemplate('title').createView()
      @elem = @title.$html[0]


    it 'fires and finds snippet event', ->
      foundComponent = undefined

      @editableController.selection.add (snippet, element, selection) ->
        foundComponent = snippet
        expect.element

      @editableController.triggerEditableEvent('selectionChanged', @elem, undefined)
      expect(foundComponent.model).to.equal(@title.model)


  describe 'enter event', ->

    beforeEach ->
      @title = test.createComponent('title', 'A')
      @componentTree.append(@title)
      @design = @componentTree.design


    it 'inserts a second element', ->
      @editableController.insert(@title.createView())
      expect(@componentTree.toJson().content.length).to.equal(2)


    it 'inserts the default paragraph element', ->
      expect(@design.defaultParagraph.name).to.equal('text')
      @editableController.insert(@title.createView())
      expect(@renderer.componentTree.toJson().content[1].identifier).to.equal('test.text')


    it 'inserts the paragraph snippet defined by the design', ->
      @design.defaultParagraph = test.getTemplate('title')
      @editableController.insert(@title.createView())
      expect(@renderer.componentTree.toJson().content[1].identifier).to.equal('test.title')


  describe 'split event', ->

    beforeEach ->
      @title = test.createComponent('title', 'A')
      @componentTree.append(@title)

      @before = document.createDocumentFragment()
      @before.appendChild( $('<span>hey</span>')[0] )
      @after = document.createDocumentFragment()
      @after.appendChild( $('<span>there</span>')[0] )


    it 'inserts a second element', ->
      @editableController.split(@title.createView(), 'title', @before, @after)
      content = @componentTree.toJson().content
      expect(content.length).to.equal(2)
      expect(content[0].content.title).to.equal('<span>hey</span>')
      expect(content[1].content.title).to.equal('<span>there</span>')


