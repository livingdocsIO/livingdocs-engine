describe 'testHelpers', ->

  describe 'createComponentTree()', ->

    # If only one element has to be created the array
    # declaration can be omitted.
    it 'creates a componentTree with one title', ->
      componentTree = test.createComponentTree
        title: { title: 'It Works' }

      firstComponent = componentTree.first()
      expect(firstComponent.get('title')).to.equal('It Works')


    it 'creates a componentTree with two titles', ->
      componentTree = test.createComponentTree [
        title: { title: 'A' }
      ,
        title: { title: 'B' }
      ]
      firstComponent = componentTree.first()
      expect(firstComponent.get('title')).to.equal('A')
      expect(firstComponent.next.get('title')).to.equal('B')
