describe 'testHelpers', ->

  describe 'createComponentTree()', ->

    # If only one element has to be created the array
    # declaration can be omitted.
    it 'creates a componentTree with one title', ->
      componentTree = test.createComponentTree
        title: { title: 'It Works' }

      firstSnippet = componentTree.first()
      expect(firstSnippet.get('title')).to.equal('It Works')


    it 'creates a componentTree with two titles', ->
      componentTree = test.createComponentTree [
        title: { title: 'A' }
      ,
        title: { title: 'B' }
      ]
      firstSnippet = componentTree.first()
      expect(firstSnippet.get('title')).to.equal('A')
      expect(firstSnippet.next.get('title')).to.equal('B')
