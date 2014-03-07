Kickstart = require('../../../src/kickstart/kickstart')
testDesign = require('../../support/test_design')

describe 'kickstart', ->

  beforeEach ->
    @kickstart = new Kickstart
      xmlTemplate: '<root><text>fasdf</text></root>',
      design: testDesign

    @text1 = "Testparagraph1"
    @text2 = "Testparagraph2"


  describe 'nodeToSnippetName()', ->

    it 'returns a valid snippetName', ->
      html = Kickstart.parseXML("<stuffed-container><a>Test</a></stuffed-container>")
      snippetName = @kickstart.nodeToSnippetName(html)
      expect(snippetName).to.equal('stuffedContainer')


  describe 'appendSnippetToContainer()', ->

    it 'populates a snippet', ->
      row = test.getSnippet('row')
      data = Kickstart.parseXML("<text><text>#{@text1}</text></text>")
      @kickstart.appendSnippetToContainer(row, data,  'main')
      expect(row.containers.main.first.get('text')).to.equal(@text1)

    it 'populates a snippet without editable', ->
      row = test.getSnippet('row')
      data = Kickstart.parseXML("<text>#{@text1}</text>")
      @kickstart.appendSnippetToContainer(row, data,  'main')
      expect(row.containers.main.first.get('text')).to.equal(@text1)


  describe 'populateSnippetContainers()', ->

    it 'populates snippets of snippet containers', ->
      row = test.getSnippet('row')
      template = Kickstart.parseXML """
        <div>
          <main><text>#{@text1}</text></main>
          <sidebar><text>#{@text2}</text></sidebar>
        </div>
      """
      @kickstart.populateSnippetContainers(row, template)
      expect(row.containers.main.first.get('text')).to.equal(@text1)
      expect(row.containers.sidebar.first.get('text')).to.equal(@text2)

    it 'ignores empty containers', ->
      row = test.getSnippet('row')
      template = Kickstart.parseXML("<main-and-sidebar><main></main></main-and-sidebar>")
      @kickstart.populateSnippetContainers(row, template)
      expect(row.containers.main.first).to.be.undefined
      expect(row.containers.sidebar.first).to.be.undefined

    it 'uses default container if only one exists', ->
      containerTemplate = test.getSnippet('container')
      template = Kickstart.parseXML("<container><text>#{@text1}</text></container>")
      @kickstart.populateSnippetContainers(containerTemplate, template)
      expect(containerTemplate.containers.default.first.get('text')).to.equal(@text1)


  describe 'setEditableStyles()', ->

    it 'sets style with spaces', ->
      hero = test.getSnippet('hero')
      template = Kickstart.parseXML("<hero doc-styles='Extra Space: extra-space'></hero>")
      @kickstart.setEditableStyles(hero, template)
      expect(hero.style('Extra Space')).to.equal('extra-space')

    it 'ignores empty styles', ->
      hero = test.getSnippet('hero')
      template = Kickstart.parseXML("<hero doc-styles='Extra Space'></hero>")
      @kickstart.setEditableStyles(hero, template)
      expect(hero.style('Extra Space')).to.be.undefined


  describe 'getValueForEditable()', ->

    it 'gets string value from the kickstart template', ->
      expected = "title"
      template = Kickstart.parseXML("<div><title>#{expected}</title><foo>bar</foo></div>")
      value = @kickstart.getValueForEditable('title', template)
      expect(expected).to.equal(value)


    it 'get html value from kickstart template', ->
      expected = "<div>bar<b>Foo</b></div>"
      template = Kickstart.parseXML("<div><title>#{expected}</title><foo>bar</foo></div>")
      content = @kickstart.getValueForEditable('title', template)
      expect(content).to.have.html(expected)


  describe 'setEditables()', ->

    beforeEach ->
      @a = test.getSnippet('hero')
      @b = test.getSnippet('hero')
      @template = Kickstart.parseXML """
        <hero>
          <title>#{ @text1 }</title>
          <tagline>#{ @text2 }</tagline>
        </hero>
        """

    it 'sets multiple editables', ->
      @a.set('title', @text1)
      @a.set('tagline', @text2)
      @kickstart.setEditables(@b, @template)
      expect(@a.get('title')).to.equal(@b.get('title'))
      expect(@a.get('tagline')).to.equal(@b.get('tagline'))



  describe 'descendant()', ->

    it 'returns correct amount of children', ->
      template = Kickstart.parseXML """
        <title><b>test</b><b>test</b>text <p></p></title>
        """
      expect(@kickstart.descendants(template, 'b').length).to.equal(2)

    it 'returns true', ->
      template = Kickstart.parseXML """
        <title><b>test</b><b>test</b></title>
        """
      expect(@kickstart.descendants(template, 'b').length).to.equal(2)


  describe 'getXmlValue()', ->

    it 'gets a string of a node', ->
      expected = "title"
      template = Kickstart.parseXML("<test>#{expected}</test>")
      value = @kickstart.getXmlValue(template)
      expect(value).to.equal(expected)

    it 'gets html string of a node', ->
      expected = '<div>example <b>html</b> <h1>in <a>a</a> xml node</h1></div>'
      template = Kickstart.parseXML("<test>#{expected}</test>")
      value = @kickstart.getXmlValue(template)
      expect(value).to.equal(expected)

    it 'ignores empty tag', ->
      template = Kickstart.parseXML("<test></test>")
      value = @kickstart.getXmlValue(template)
      expect(value).to.be.undefined

    it 'ignores self closing tag', ->
      template = Kickstart.parseXML("<test/>")
      value = @kickstart.getXmlValue(template)
      expect(value).to.be.undefined
