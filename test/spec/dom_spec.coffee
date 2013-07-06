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
      template = test.getTemplate('title')
      @snippetHtml = template.createHtml()
      @$html = @snippetHtml.$html


    it 'finds snippet from jQuery node', ->
      expect( dom.parentSnippet(@$html) ).toEqual(@snippetHtml.snippet)


    it 'finds snippet from DOM node', ->
      expect( dom.parentSnippet(@$html[0]) ).toEqual(@snippetHtml.snippet)


  describe 'parentSnippet() on row snippet', ->

    beforeEach ->
      template = test.getTemplate('row')
      @snippetHtml = template.createHtml()
      @$html = @snippetHtml.$html


    it 'finds row snippet from child node ', ->
      $node = @$html.find('.span8').first()
      expect( dom.parentSnippet($node) ).toEqual(@snippetHtml.snippet)


  describe 'parentContainer()', ->

    beforeEach ->
      @row = test.getTemplate('row').createHtml()
      @title = test.getTemplate('title').createHtml()
      @row.snippet.append('main', @title)
      @row.append('main', @title.$html)
      @$html = @row.$html


    it 'returns an object with all necessary info', ->
      elem = @title.$html[0]
      containerElem = @row.containers['main']
      containerInfo = dom.parentContainer(elem)
      expect(containerInfo.node).toEqual(containerElem)
      expect(containerInfo.containerName).toEqual('main')
      expect(containerInfo.snippetHtml).toEqual(@row)

