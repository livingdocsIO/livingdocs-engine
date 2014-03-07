require('../../support/stubs/editable_stub')
EditableController = require('../../../src/interaction/editable_controller')

describe 'editableController', ->

  beforeEach ->
    @editableController = new EditableController()


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
