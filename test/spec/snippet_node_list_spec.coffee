describe 'SnippetNodeList', ->


  describe 'add', ->


    beforeEach ->
      @list = new SnippetNodeList()
      @node = name: 'foo', type: 'editable'
      @list.add(@node)


    it 'adds the snippet', ->
      expect(@list.all['foo']).toBe(@node)


    it 'makes the snippet available by its type', ->
      expect(@list.editable['foo']).toBe(@node.htmlNode)


    describe 'adding a snippet with a name that is used by another snippet', ->


      it 'throws an error', ->
        node = name: @node.name, type: 'image'
        expect( => @list.add(node) ).toThrow()

      it 'throws a nice error', ->
        try
          node = name: @node.name, type: 'image'
          @list.add(node)
        catch error
          expect(error.message).toContain('data-doc-image')
