describe 'testHelpers', ->

  describe 'createSnippetTree()', ->

    # If only one element has to be created the array
    # declaration can be omitted.
    it 'creates a snippet tree with one title', ->
      componentTree = test.createSnippetTree
        title: { title: 'It Works' }

      firstSnippet = componentTree.first()
      expect(firstSnippet.get('title')).to.equal('It Works')


    it 'creates a snippet tree with two titles', ->
      componentTree = test.createSnippetTree [
        title: { title: 'A' }
      ,
        title: { title: 'B' }
      ]
      firstSnippet = componentTree.first()
      expect(firstSnippet.get('title')).to.equal('A')
      expect(firstSnippet.next.get('title')).to.equal('B')
