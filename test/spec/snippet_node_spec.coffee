describe 'SnippetNode', ->

  describe 'node without attributes', ->

    beforeEach ->
      @elem = $('<div/>')[0]


    it 'is not a data node', ->
      node = new SnippetNode(@elem)
      expect(node.isDirective).toBeFalsy()


  describe 'container node', ->

    beforeEach ->
      @elem = $("<div #{ templateAttr.container } />")[0]


    it 'is dataNode', ->
      node = new SnippetNode(@elem)
      expect(node.isDirective).toBeTruthy()


    it 'is of type container', ->
      node = new SnippetNode(@elem)
      expect(node.type).toEqual('container')


  describe 'convert templateAttr into docAttr', ->

    it 'unifies attribute naming style', ->
      @nude = $("<div #{ templateAttr.container } />")[0]
      @x =    $("<div x-#{ templateAttr.container } />")[0]
      @data = $("<div data-#{ templateAttr.container } />")[0]
      for node in [@nude, @x, @data]
        node = new SnippetNode(node).elem
        expect( node.hasAttribute(docAttr.container) ).toBeTruthy()


  describe 'nodes with different attribute naming styles', ->

    it 'finds data- prepended editable', ->
      @elem = $("<div data-#{ templateAttr.editable } />")[0]
      node = new SnippetNode(@elem)
      expect(node.type).toEqual('editable')


    it 'finds x- prepended editable', ->
      @elem = $("<div x-#{ templateAttr.editable } />")[0]
      node = new SnippetNode(@elem)
      expect(node.type).toEqual('editable')


  describe 'type', ->

    it 'uses the key of the attribute constant as the type', ->
      templateAttrLookup['doc-bar'] = 'foo'
      elem = $('<div doc-bar />')[0]
      node = new SnippetNode(elem)
      delete templateAttrLookup.foo

      expect(node.type).toBe('foo')
