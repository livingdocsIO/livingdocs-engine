require('../../support/stubs/editable_stub')
EditableController = require('../../../src/interaction/editable_controller')

describe 'editableController', ->

  beforeEach ->
    { @renderer, @snippetTree } = getInstances('page', 'renderer')
    @editableController = new EditableController(@renderer.renderingContainer)


  describe 'selection event', ->

    beforeEach ->
      @title = test.getTemplate('title').createView()
      @elem = @title.$html[0]


    it 'fires and finds snippet event', ->
      foundSnippet = undefined

      @editableController.selection.add (snippet, element, selection) ->
        foundSnippet = snippet
        expect.element

      Editable.selection.fire(@elem, undefined)
      expect(foundSnippet.model).to.equal(@title.model)


  describe 'enter event', ->

    beforeEach ->
      @title = test.createSnippet('title', 'A') #test.getTemplate('title').createView()
      @snippetTree.append(@title)


    it 'inserts a second element', ->
      @editableController.insert(@title.createView())
      expect(@snippetTree.toJson().content.length).to.equal(2)


    it 'inserts the default paragraph element', ->
      @editableController.insert(@title.createView())
      expect(@snippetTree.toJson().content[1].identifier).to.equal('test.p')
