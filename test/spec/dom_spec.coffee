describe 'DOM method', ->

  describe 'findSnippetView()', ->

    it 'returns undefined when called with undefined', ->
      expect( dom.findSnippetView(undefined) ).toEqual(undefined)


  describe 'findContainer()', ->

    it 'returns empty object when called with undefined', ->
      expect( dom.findContainer(undefined) ).toEqual({})


  describe 'dropTarget()', ->

    it 'returns empty object when called with undefined', ->
      expect( dom.dropTarget(undefined, {}) ).toEqual({})


  describe 'findSnippetView() on title snippet', ->

    beforeEach ->
      @view = test.getTemplate('title').createView()
      @$html = @view.$html


    it 'finds snippet from jQuery node', ->
      expect( dom.findSnippetView(@$html) ).toEqual(@view)


    it 'finds snippet from DOM node', ->
      expect( dom.findSnippetView(@$html[0]) ).toEqual(@view)


  describe 'findSnippetView() on row snippet', ->

    beforeEach ->
      @view = test.getTemplate('row').createView()
      @$html = @view.$html


    it 'finds row snippet from child node ', ->
      $node = @$html.find('.span8').first()
      expect( dom.findSnippetView($node) ).toEqual(@view)


  describe 'findContainer()', ->

    beforeEach ->
      @row = test.getTemplate('row').createView()
      @title = test.getTemplate('title').createView()
      @row.model.append('main', @title)
      @row.append('main', @title.$html)
      @$html = @row.$html


    it 'returns an object with all necessary info', ->
      elem = @title.$html[0]
      containerElem = @row.containers['main']
      containerInfo = dom.findContainer(elem)
      expect(containerInfo.node).toEqual(containerElem)
      expect(containerInfo.containerName).toEqual('main')
      expect(containerInfo.snippetView).toEqual(@row)

