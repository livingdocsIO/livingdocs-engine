dom = require('../../../src/interaction/dom')

describe 'DOM method', ->

  describe 'findSnippetView()', ->

    it 'returns undefined when called with undefined', ->
      expect( dom.findSnippetView(undefined) ).to.be.undefined


  describe 'findContainer()', ->

    it 'returns empty object when called with undefined', ->
      expect( dom.findContainer(undefined) ).to.deep.equal({})


  describe 'dropTarget()', ->

    it 'returns undefined object when called with undefined', ->
      expect( dom.dropTarget(undefined, {}) ).to.be.undefined


  describe 'findSnippetView() on title snippet', ->

    beforeEach ->
      @view = test.getTemplate('title').createView()
      @$html = @view.$html


    it 'finds snippet from jQuery node', ->
      expect( dom.findSnippetView(@$html) ).to.equal(@view)


    it 'finds snippet from DOM node', ->
      expect( dom.findSnippetView(@$html[0]) ).to.equal(@view)


  describe 'findSnippetView() on row snippet', ->

    beforeEach ->
      @view = test.getTemplate('row').createView()
      @$html = @view.$html


    it 'finds row snippet from child node ', ->
      $node = @$html.find('.span8').first()
      expect( dom.findSnippetView($node) ).to.equal(@view)


  describe 'findNodeContext() on image snippet', ->

    beforeEach ->
      @view = test.getTemplate('image').createView()
      @$html = @view.$html

    it 'finds image node context from DOM node', ->
      $node = @$html.findIn('img').first()
      expect( dom.findNodeContext($node) ).to.deep.equal
        contextAttr: 'data-doc-image'
        attrName: 'image'


  describe 'findNodeContext() on cover snippet', ->

    beforeEach ->
      @view = test.getTemplate('cover').createView()
      @$html = @view.$html


    it 'finds editable node context from DOM node', ->
      $node = @$html.find('h2').first()
      expect( dom.findNodeContext($node) ).to.deep.equal
        contextAttr: 'data-doc-editable'
        attrName: 'maintitle'


    it 'finds image node context from DOM node', ->
      $node = @$html.find('div').first()
      expect( dom.findNodeContext($node) ).to.deep.equal
        contextAttr: 'data-doc-image'
        attrName: 'image'


  describe 'findNodeContext() on html snippet', ->

    beforeEach ->
      @view = test.getTemplate('html').createView()
      @$html = @view.$html


    it 'finds html node context from DOM node', ->
      $node = @$html.findIn('div').first()
      expect( dom.findNodeContext($node) ).to.deep.equal
        contextAttr: 'data-doc-html'
        attrName: 'html'


    it 'finds html node context from child node', ->
      $node = @$html.find('.html-placeholder').first()
      expect( dom.findNodeContext($node) ).to.deep.equal
        contextAttr: 'data-doc-html'
        attrName: 'html'


  describe 'findContainer()', ->

    beforeEach ->
      @row = test.getTemplate('row').createView()
      @title = test.getTemplate('title').createView()
      @row.model.append('main', @title)
      @title.$html.appendTo(@row.getDirectiveElement('main'))
      @$html = @row.$html


    it 'returns an object with all necessary info', ->
      elem = @title.$html[0]
      containerElem = @row.directives.get('main').elem
      containerInfo = dom.findContainer(elem)
      expect(containerInfo.node).to.equal(containerElem)
      expect(containerInfo.containerName).to.equal('main')
      expect(containerInfo.componentView).to.equal(@row)

