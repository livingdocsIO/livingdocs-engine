describe 'editableController', ->

  beforeEach ->
    editableController.setup()


  describe 'selection event', ->

    beforeEach ->
      @title = test.getSnippet('title')
      @title.createHtml()
      @elem = @title.snippetHtml.$html[0]


    it 'fires and finds snippet event', ->
      foundSnippet = undefined

      editableController.selection.add (snippet, element, selection) ->
        foundSnippet = snippet
        expect.element

      Editable.selection.fire(@elem, undefined)
      expect(foundSnippet).toEqual(@title)
