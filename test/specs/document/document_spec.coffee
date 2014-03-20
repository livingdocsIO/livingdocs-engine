Document = require('../../../src/document')

describe 'document', ->

  describe 'instantiation', ->
    beforeEach ->
      { @snippetTree } = getInstances('snippetTree')


    it 'creates a new document', ->
      doc = new Document({ @snippetTree })
      expect(doc).to.be.an.instanceof(Document)


  describe 'events', ->
    beforeEach ->
      { @snippetTree } = getInstances('snippetTree')
      @doc = new Document({ @snippetTree })


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


  describe 'serialize()', ->
    beforeEach ->
      { @snippetTree } = getInstances('snippetTree')
      @doc = new Document({ @snippetTree })


    it 'serializes an empty document', ->
      expect(@doc.serialize()).to.deep.equal
        content: []
        design:
          name: 'test'


    it 'serializes a minimal document', ->
      model = test.getSnippet('title')
      model.set('title', 'It Works')
      @snippetTree.append(model)
      data = @doc.serialize()
      expect(data.content.length).to.equal(1)


  describe 'toHtml()', ->
    beforeEach ->
      { @snippetTree } = getInstances('snippetTree')
      @doc = new Document({ @snippetTree })


    it 'renders an empty document', ->
      expect(@doc.toHtml()).to.equal('')


    it 'renders a minimal document', ->
      model = test.getSnippet('title')
      model.set('title', 'It Works')
      @snippetTree.append(model)
      expect(@doc.toHtml()).to.have.same.html """
        <h1>It Works</h1>"""


  describe 'toJson()', ->
    beforeEach ->
      { @snippetTree } = getInstances('snippetTree')
      @doc = new Document({ @snippetTree })


    it 'renders an empty document', ->
      expect(@doc.toJson()).to.equal(
        '{"content":[],"design":{"name":"test"}}')


    it 'renders an empty document with prettify', ->
      expect(@doc.toJson('prettify')).to.contain('\n  ')

