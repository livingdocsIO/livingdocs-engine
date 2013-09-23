describe 'SnippetContainer', ->

  describe '#isAttachedToDom', ->
    container = null

    beforeEach ->
      container = new SnippetContainer({})

    describe 'when it is root', ->
      it 'is truthy', ->
        container.isRoot = true
        expect(container.isAttachedToDom()).toBeTruthy()

    describe 'when it has a parent snippet that is attached to dom', ->
      it 'is truthy', ->
        container.parentSnippet = { isAttachedToDom: -> true }
        expect(container.isAttachedToDom()).toBeTruthy()

    describe 'when it has a parent snippet that is not attached to dom', ->
      it 'is falsy', ->
        container.parentSnippet = { isAttachedToDom: -> false }
        expect(container.isAttachedToDom()).toBeFalsy()

    describe 'when it does not have a parent snippet view', ->
      it 'is falsy', ->
        expect(container.isAttachedToDom()).toBeFalsy()
