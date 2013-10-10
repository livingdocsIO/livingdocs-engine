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


  describe 'appendSnippetToContainer()', ->

    it 'populates a snippet', ->
      row = test.getSnippet('row')
      data = $("<text><text>#{@text1}</text></text>")[0]
      kickstart.appendSnippetToContainer(row, data,  'main')
      expect(row.containers.main.first.get('text')).toEqual(@text1)

    it 'populates a snippet without editable', ->
      row = test.getSnippet('row')
      data = $("<text>#{@text1}</text>")[0]
      kickstart.appendSnippetToContainer(row, data,  'main')
      expect(row.containers.main.first.get('text')).toEqual(@text1)


  describe 'populateSnippetContainers()', ->

    it 'populates snippets of snippet containers', ->
      row = test.getSnippet('row')
      template = $("<div><main><text>#{@text1}</text></main><sidebar><text>#{@text2}</text></sidebar></div>")[0]
      kickstart.populateSnippetContainers(row, template);
      expect(row.containers.main.first.get('text')).toEqual(@text1)
      expect(row.containers.sidebar.first.get('text')).toEqual(@text2)

    it 'ignores empty containers', ->
      row = test.getSnippet('row')
      template = $("<main-and-sidebar><main></main></main-and-sidebar>")[0]
      kickstart.populateSnippetContainers(row, template);
      expect(row.containers.main.first).toBeUndefined()
      expect(row.containers.sidebar.first).toBeUndefined()

    it 'uses default container if only one exists', ->
      containerTemplate = test.getSnippet('container')
      template = $("<container><text>#{@text1}</text></container>")[0]
      kickstart.populateSnippetContainers(containerTemplate, template);
      expect(containerTemplate.containers.default.first.get('text')).toEqual(@text1)


  describe 'getValueForEditable()', ->

    it 'gets string value from the kickstart template', ->
      expected = "title"
      template = $.parseXML("<div><title>#{expected}</title><foo>bar</foo></div>")
      value = kickstart.getValueForEditable('title', template)
      expect(expected).toEqual(value)

    it 'get html value from kickstart template', ->
      expected = "<div>bar<b>Foo</b></div>"
      template = $.parseXML("<div><title>#{expected}</title><foo>bar</foo></div>")
      value = kickstart.getValueForEditable('title', template)
      expect( htmlCompare.compare($(expected)[0], value) ).toBe(true)


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


  describe 'getXmlValue()', ->

    it 'gets a string of a node', ->
      expected = "title"
      template = $.parseXML("<test>#{expected}</test>").firstChild
      #value = expected
      value = kickstart.getXmlValue(template)
      expect(value).toEqual(expected)

    it 'gets html string of a node', ->
      expected = '<div>example <b>html</b> <h1>in <a>a</a> xml node</h1></div>';
      template = $.parseXML("<test>#{expected}</test>").firstChild
      value = kickstart.getXmlValue(template)
      expect(value).toEqual(expected)
