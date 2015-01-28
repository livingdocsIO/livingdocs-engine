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

    beforeEach (done) ->
      @componentTree = @doc.componentTree
      @html = test.createComponent('html')
      @html.setContent('source', '<script>scriptTest = "halleluja!";</script>')
      @componentTree.append(@html)
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


    it 'executes scripts in the iframe when components are added before createView()', ->
      expect(@iframe.contentWindow.scriptTest).to.equal('halleluja!')


    it 'executes scripts in the iframe when components are added after the renderer is ready', ->
      newHtml = test.createComponent('html')
      newHtml.setContent('source', '<script>otherScriptTest = "interesting!";</script>')
      @componentTree.append(newHtml)
      expect(@iframe.contentWindow.otherScriptTest).to.equal('interesting!')


    it 'executes scripts when content is updated', ->
      @iframe.contentWindow.scriptCounter = 0
      @html.setContent('source', '<script>scriptCounter += 1;</script>')
      expect(@iframe.contentWindow.scriptCounter).to.equal(1)


    it 'does not execute scripts when content is updated twice with the same value', ->
      @iframe.contentWindow.scriptCounter = 0
      @html.setContent('source', '<script>scriptCounter += 1;</script>')
      @html.setContent('source', '<script>scriptCounter += 1;</script>')
      expect(@iframe.contentWindow.scriptCounter).to.equal(1)


    it 'does execute scripts when content is updated with a different value', ->
      @iframe.contentWindow.scriptCounter = 0
      @html.setContent('source', '<script>scriptCounter += 1;</script>')
      @html.setContent('source', '<script>scriptCounter += 2;</script>')
      expect(@iframe.contentWindow.scriptCounter).to.equal(3)
