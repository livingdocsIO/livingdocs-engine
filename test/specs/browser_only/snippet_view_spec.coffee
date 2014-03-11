describe 'Browser only: SnippetView', ->

  describe 'escapeCssUri()', ->
    beforeEach ->
      @snippet = test.getSnippet('html')
      @view = @snippet.template.createView(@snippet)


    it 'escapes an uri with paranthesis', ->
      escapedUri = @view.escapeCssUri('http://test.com/(1)')

      $elem = $('<div>')
      $elem.css('background-image', "url(#{ escapedUri })")

      # Firefox always returns the url in double quotes
      attr = $elem[0].getAttribute('style')
      attr = attr.replace(/"/g, '\'')

      expect(attr).to.equal('background-image: url(\'http://test.com/(1)\');')
