describe 'SnippetNodeList', ->


  describe 'add', ->


    beforeEach ->
      @list = new SnippetNodeList()
      @node = name: 'foo', type: 'bar'
      @list.add(@node)


    it 'adds the snippet', ->
      expect(@list.all['foo']).toBe(@node)


    it 'makes the snippet available by its type', ->
      expect(@list.bar['foo']).toBe(@node)


    describe 'adding a snippet with a name that is used by another snippet', ->


      it 'throws an error', ->
        node = name: @node.name, type: 'baz'
        expect( => @list.add(node) ).toThrow()
