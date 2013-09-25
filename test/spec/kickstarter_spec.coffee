describe 'kickstart', ->

  beforeEach ->
    doc.document.design = new Design(testDesign)
    @text1 = "Testparagraph1"
    @text2 = "Testparagraph2"


  describe 'nodeToSnippetName()', ->
    
    it 'returns a valid snippetName', ->
      html = $("<stuffed-container><a>Test</a></stuffed-container>")[0]
      snippetName = kickstart.nodeToSnippetName(html)
      expect(snippetName).toEqual('stuffedContainer')


  describe 'parseContainers()', ->

    it 'populates snippets of snippet containers', ->
      rowTemplate = test.getSnippet('row')
      template = $("<div><main><text>#{@text1}</text></main><sidebar><text>#{@text2}</text></sidebar></div>")[0]
      kickstart.parseContainers(rowTemplate, template);
      expect(rowTemplate.containers.main.first.content.text).toEqual(@text1)
      expect(rowTemplate.containers.sidebar.first.content.text).toEqual(@text2)


    it 'ignores empty containers', ->
      rowTemplate = test.getSnippet('row')
      template = $("<main-and-sidebar><main></main></main-and-sidebar>")[0]
      kickstart.parseContainers(rowTemplate, template);
      expect(rowTemplate.containers.main.first).toBeUndefined()
      expect(rowTemplate.containers.sidebar.first).toBeUndefined()


    it 'uses default container if only one exists', ->
      containerTemplate = test.getSnippet('container')
      template = $("<container><text>#{@text1}</text></container>")[0]
      kickstart.parseContainers(containerTemplate, template);
      expect(containerTemplate.containers.default.first.content.text).toEqual(@text1)


  describe 'setEditables()', ->

    beforeEach ->
      @a = test.getSnippet('hero')
      @b = test.getSnippet('hero')
      @template =
        jQuery("""
        <hero>
          <title>#{ @text1 }</title>
          <tagline>#{ @text2 }</tagline>
        </hero>
        """)[0]

    it 'sets multiple editables', ->     
      @a.set('title', @text1)
      @a.set('tagline', @text2)
      kickstart.setEditables(@b, @template)
      expect(@a.get('title')).toEqual(@b.get('title'))
      expect(@a.get('tagline')).toEqual(@b.get('tagline'))
