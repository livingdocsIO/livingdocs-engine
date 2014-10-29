Livingdoc = require('../../../src/livingdoc')

describe 'livingdoc', ->

  beforeEach ->
    { @snippetTree } = getInstances('snippetTree')
    @doc = new Livingdoc({ @snippetTree })


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

