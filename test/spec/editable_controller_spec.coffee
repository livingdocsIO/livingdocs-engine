describe 'editableController', ->

  beforeEach ->
    @editableController = new EditableController()


  describe 'selection event', ->

    beforeEach ->
      @title = test.getTemplate('title').createHtml()
      @elem = @title.$html[0]


    it 'fires and finds snippet event', ->
      foundSnippet = undefined

      @editableController.selection.add (snippet, element, selection) ->
        foundSnippet = snippet
        expect.element

      Editable.selection.fire(@elem, undefined)
      expect(foundSnippet.snippet).toEqual(@title.snippet)
