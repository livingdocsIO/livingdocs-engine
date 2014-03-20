describe 'testHelpers', ->

  describe 'createSnippetTree()', ->

    it 'create a snippet tree with one title', ->
      snippetTree = test.createSnippetTree
        title: { title: 'It Works' }

      firstSnippet = snippetTree.first()
      expect(firstSnippet.get('title')).to.equal('It Works')
