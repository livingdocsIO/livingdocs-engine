describe 'DOM method', ->

  describe 'parentSnippet()', ->

    it 'returns undefined when called with undefined', ->
      expect( dom.parentSnippet(undefined) ).toEqual(undefined)


  describe 'parentContainer()', ->

    it 'returns empty object when called with undefined', ->
      expect( dom.parentContainer(undefined) ).toEqual({})


  describe 'dropTarget()', ->

    it 'returns empty object when called with undefined', ->
      expect( dom.dropTarget(undefined) ).toEqual({})


  describe 'parentSnippet() on title snippet', ->

    beforeEach ->
      @snippet = test.getSnippet('title')
      @snippet.createHtml()
      @$html = @snippet.snippetHtml.$html


    it 'finds snippet from jQuery node', ->
      expect( dom.parentSnippet(@$html) ).toEqual(@snippet)


    it 'finds snippet from DOM node', ->
      expect( dom.parentSnippet(@$html[0]) ).toEqual(@snippet)


  describe 'parentSnippet() on row snippet', ->

    beforeEach ->
      @snippet = test.getSnippet('row')
      @snippet.createHtml()
      @$html = @snippet.snippetHtml.$html


    it 'finds row snippet from child node ', ->
      $node = @$html.find('.span8').first()
      expect( dom.parentSnippet($node) ).toEqual(@snippet)


  describe 'parentContainer()', ->

    beforeEach ->
      @row = test.getSnippet('row')
      @row.createHtml()
      @title = test.getSnippet('title')
      @title.createHtml()
      @row.append('main', @title)
      @row.snippetHtml.append('main', @title.snippetHtml.$html)
      @$html = @row.snippetHtml.$html


    it 'returns an object with all necessary info', ->
      elem = @title.snippetHtml.$html[0]
      containerElem = @row.snippetHtml.containers['main']
      containerInfo = dom.parentContainer(elem)
      expect(containerInfo.node).toEqual(containerElem)
      expect(containerInfo.containerName).toEqual('main')
      expect(containerInfo.snippet).toEqual(@row)

