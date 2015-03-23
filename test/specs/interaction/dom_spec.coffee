dom = require('../../../src/interaction/dom')

describe 'dom:', ->

  describe 'findComponentView()', ->

    it 'returns undefined when called with undefined', ->
      expect( dom.findComponentView(undefined) ).to.be.undefined


  describe 'findContainer()', ->

    it 'returns empty object when called with undefined', ->
      expect( dom.findContainer(undefined) ).to.deep.equal({})


  describe 'dropTarget()', ->

    it 'returns undefined object when called with undefined', ->
      expect( dom.dropTarget(undefined, {}) ).to.be.undefined


  describe 'findComponentView() on title component', ->

    beforeEach ->
      @view = test.getTemplate('title').createView()
      @$html = @view.$html


    it 'finds component from jQuery node', ->
      expect( dom.findComponentView(@$html) ).to.equal(@view)


    it 'finds component from DOM node', ->
      expect( dom.findComponentView(@$html[0]) ).to.equal(@view)


  describe 'findComponentView() on row component', ->

    beforeEach ->
      @view = test.getTemplate('row').createView()
      @$html = @view.$html


    it 'finds row component from child node ', ->
      $node = @$html.find('.span8').first()
      expect( dom.findComponentView($node) ).to.equal(@view)


  describe 'getDirectiveContext() on image component', ->

    beforeEach ->
      @view = test.getTemplate('image').createView()
      @$html = @view.$html

    it 'finds image node context from DOM node', ->
      $node = @$html.findIn('img').first()
      expect( dom.getDirectiveContext($node) ).to.deep.equal
        'image':
          name: 'image'
          type: 'image'


  describe 'getDirectiveContext() on cover component', ->

    beforeEach ->
      @view = test.getTemplate('cover').createView()
      @$html = @view.$html


    it 'finds editable node context from DOM node', ->
      $node = @$html.find('h2').first()
      expect( dom.getDirectiveContext($node) ).to.deep.equal
        'editable':
          name: 'maintitle'
          type: 'editable'


    it 'finds image node context from DOM node', ->
      $node = @$html.find('div').first()
      expect( dom.getDirectiveContext($node) ).to.deep.equal
        'image':
          name: 'image'
          type: 'image'


  describe 'getDirectiveContext() on html component', ->

    beforeEach ->
      @view = test.getTemplate('html').createView()
      @$html = @view.$html


    it 'finds html node context from DOM node', ->
      $node = @$html.findIn('div').first()
      expect( dom.getDirectiveContext($node) ).to.deep.equal
        'html':
          name: 'source'
          type: 'html'


    it 'finds html node context from child node', ->
      $node = @$html.find('.html-placeholder').first()
      expect( dom.getDirectiveContext($node) ).to.deep.equal
        'html':
          name: 'source'
          type: 'html'


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

