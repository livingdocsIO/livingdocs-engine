describe 'DirectiveCollection', ->

  describe 'add', ->

    beforeEach ->
      @list = new DirectiveCollection()
      @node = name: 'foo', type: 'editable'
      @list.add(@node)


    it 'adds the snippet', ->
      expect(@list.all['foo']).toBe(@node)


    it 'has a length of one', ->
      expect(@list.length).toEqual(1)


    it 'has one directive of type editable', ->
      expect(@list['editable'].length).toEqual(1)


    it 'makes the directive accessible by a pseudo array', ->
      expect(@list[0]).toBe(@node)


    it 'makes the directive accessible by its name', ->
      expect(@list.get('foo')).toBe(@node)


    it 'makes the snippet available by its type', ->
      expect(@list.editable['foo']).toBe(@node.elem)


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
