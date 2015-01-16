Livingdoc = require('../../../src/livingdoc')

describe '(browser only) livingdoc:', ->

  beforeEach ->
    { @componentTree } = test.get('componentTree')
    @doc = new Livingdoc({ @componentTree })


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


  describe 'scripts in components', ->

    it.only 'executes scripts in doc-html within the iframe', (done) ->
      @doc.createView(undefined)
      .then ({ iframe, renderer }) =>
        renderer.ready =>
          componentTree = @doc.componentTree
          html = test.createComponent('html')
          html.setContent('source', '<script>window.testXy = "halleluja!";</script>')
          componentTree.append(html)
          console.log 'testXy:', window.testXy
          console.log 'iframe.testXy:', iframe.contentWindow.testXy
          expect(iframe.contentWindow.testXy).to.equal('hey')

