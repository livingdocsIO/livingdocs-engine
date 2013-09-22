describe 'kickstart', ->

  describe 'nodeToSnippetName()', ->
    
    it 'returns a valid snippetName', ->
      html = $("<stuffed-container><a>Test</a></stuffed-container>")[0]
      snippetName = kickstart.nodeToSnippetName(html)
      expect(snippetName).toEqual('stuffedContainer')


  describe 'setEditables()', ->

    beforeEach ->
      @a = test.getSnippet('hero')
      @b = test.getSnippet('hero')
      @titleText = "Title blabla"
      @taglineText = "Foo bar"
      @kickstartTemplate =
        jQuery("""
        <hero>
          <title>#{ @titleText }</title>
          <tagline>#{ @taglineText }</tagline>
        </hero>
        """)[0]

    it 'sets multiple editables', ->     
      @a.set('title', @titleText)
      @a.set('tagline', @taglineText)
      kickstart.setEditables(@b, @kickstartTemplate)
      
      expect(@a.get('title')).toEqual(@b.get('title'))
      expect(@a.get('tagline')).toEqual(@b.get('tagline'))
