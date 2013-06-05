describe 'DOM method', ->

  describe '#parentSnippet() on title snippet', ->

    beforeEach ->
      @snippet = test.getSnippet('title')
      @snippet.createHtml()
      @$html = @snippet.snippetHtml.$html


    it 'finds snippet from jQuery node', ->
      expect( dom.parentSnippet(@$html) ).toEqual(@snippet)


    it 'finds snippet from DOM node', ->
      expect( dom.parentSnippet(@$html[0]) ).toEqual(@snippet)


  describe '#parentSnippet() on row snippet', ->

    beforeEach ->
      @snippet = test.getSnippet('row')
      @snippet.createHtml()
      @$html = @snippet.snippetHtml.$html


    it 'finds row snippet from child node ', ->
      $node = @$html.find('.span8').first()
      expect( dom.parentSnippet($node) ).toEqual(@snippet)
