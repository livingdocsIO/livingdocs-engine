Livingdoc = require('../../../src/livingdoc')

describe 'livingdoc', ->

  describe 'instantiation', ->
    beforeEach ->
      { @snippetTree } = getInstances('snippetTree')


    it 'creates a new livingdoc', ->
      doc = new Livingdoc({ @snippetTree })
      expect(doc).to.be.an.instanceof(Livingdoc)


  describe 'events', ->
    beforeEach ->
      { @snippetTree } = getInstances('snippetTree')
      @doc = new Livingdoc({ @snippetTree })


    it 'emits a change event', (done) ->
      @doc.on 'change', ->
        done()

      snippet = test.getSnippet('title')
      @snippetTree.append(snippet)


  describe 'createView()', ->


    it 'creates a readOnly iframe view', (done) ->
      @doc.createView().then ({ iframe, renderer }) ->
        expect(renderer.renderingContainer.isReadOnly).to.be.true
        done()


    it 'accepts a wrapper as an argument', (done) ->
      $wrapper = $('<div class="wrapper doc-section"></div>')
      @doc.createView(undefined, $wrapper: $wrapper)
      .then ({ iframe, renderer }) ->
        expect(renderer.$wrapperHtml).to.exist
        done()


  describe 'serialize()', ->
    beforeEach ->
      { @snippetTree } = getInstances('snippetTree')
      @doc = new Livingdoc({ @snippetTree })


    it 'serializes an empty livingdoc', ->
      expect(@doc.serialize()).to.deep.equal
        content: []
        design:
          name: 'test'


    it 'serializes a minimal livingdoc', ->
      model = test.getSnippet('title')
      model.set('title', 'It Works')
      @snippetTree.append(model)
      data = @doc.serialize()
      expect(data.content.length).to.equal(1)


  describe 'toHtml()', ->
    beforeEach ->
      { @snippetTree } = getInstances('snippetTree')
      @doc = new Livingdoc({ @snippetTree })


    it 'renders an empty livingdoc', ->
      expect(@doc.toHtml()).to.equal('')


    it 'renders a minimal livingdoc', ->
      model = test.getSnippet('title')
      model.set('title', 'It Works')
      @snippetTree.append(model)
      expect(@doc.toHtml()).to.have.same.html """
        <h1>It Works</h1>"""


  describe 'toJson()', ->
    beforeEach ->
      { @snippetTree } = getInstances('snippetTree')
      @doc = new Livingdoc({ @snippetTree })


    it 'renders an empty livingdoc', ->
      expect(@doc.toJson()).to.equal(
        '{"content":[],"design":{"name":"test"}}')


    it 'renders an empty livingdoc with prettify', ->
      expect(@doc.toJson('prettify')).to.contain('\n  ')

