describe 'SnippetNode', ->


  describe 'isDataNode', ->


    describe 'when node is not a data node', ->


      it 'is falsy', ->
        htmlNode = $('<div/>')[0]
        node = new SnippetNode(htmlNode)
        expect(node.isDataNode).toBeFalsy()


    describe 'when node is a data node', ->


      it 'is true', ->
        htmlNode = $("<div #{docAttr.container} />")[0]
        node = new SnippetNode(htmlNode)
        expect(node.isDataNode).toBeTruthy()


  describe 'type', ->


    it 'uses the key of the attribute constant as the type', ->
      docAttr.foo = 'doc-bar'
      htmlNode = $('<div doc-bar />')[0]
      node = new SnippetNode(htmlNode)
      delete docAttr.foo

      expect(node.type).toBe('foo')
