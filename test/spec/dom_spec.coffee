describe 'DOM method', ->

  describe 'parentSnippet()', ->

    it 'returns undefined when called with undefined', ->
      expect( dom.parentSnippet(undefined) ).toEqual(undefined)


  describe 'parentContainer()', ->

    it 'returns empty object when called with undefined', ->
      expect( dom.parentContainer(undefined) ).toEqual({})


  describe 'dropTarget()', ->

    it 'returns empty object when called with undefined', ->
      expect( dom.dropTarget(undefined, {}) ).toEqual({})


  describe 'parentSnippet() on title snippet', ->

    beforeEach ->
      @snippetView = test.getTemplate('title').createView()
      @$html = @snippetView.$html


    it 'finds snippet from jQuery node', ->
      expect( dom.parentSnippetView(@$html) ).toEqual(@snippetView)


    it 'finds snippet from DOM node', ->
      expect( dom.parentSnippetView(@$html[0]) ).toEqual(@snippetView)


  describe 'parentSnippet() on row snippet', ->

    beforeEach ->
      @snippetView = test.getTemplate('row').createView()
      @$html = @snippetView.$html


    it 'finds row snippet from child node ', ->
      $node = @$html.find('.span8').first()
      expect( dom.parentSnippetView($node) ).toEqual(@snippetView)


  describe 'parentContainer()', ->

    beforeEach ->
      @row = test.getTemplate('row').createView()
      @title = test.getTemplate('title').createView()
      @row.model.append('main', @title)
      @row.append('main', @title.$html)
      @$html = @row.$html


    it 'returns an object with all necessary info', ->
      elem = @title.$html[0]
      containerElem = @row.containers['main']
      containerInfo = dom.parentContainer(elem)
      expect(containerInfo.node).toEqual(containerElem)
      expect(containerInfo.containerName).toEqual('main')
      expect(containerInfo.snippetView).toEqual(@row)

