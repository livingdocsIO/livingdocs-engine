Livingdoc = require('../../../src/livingdoc')
View = require('../../../src/rendering/view')

describe '(browser only) livingdoc:', ->

  beforeEach ->
    { @componentTree } = test.get('componentTree')
    @doc = new Livingdoc({ @componentTree })


  describe 'createView()', ->

    it 'creates a readOnly iframe view by default', (done) ->
      @doc.createView().then ({ iframe, renderer }) =>
        expect(iframe).to.have.html('<iframe frameborder="0" src="about:blank">')
        expect(renderer.renderingContainer.isReadOnly).to.equal(true)
        done()


    it 'creates an interactive iframe view', (done) ->
      @doc.createView(interactive: true, loadResources: false).then ({ iframe, renderer }) =>
        expect(renderer.renderingContainer.isReadOnly).to.equal(false)
        expect(@doc.interactiveView).to.be.an.instanceof(View)
        expect(@doc.readOnlyViews.length).to.equal(0)
        done()


    it 'adds the view to the readyOnly array', (done) ->
      @doc.createView().then ({ iframe, renderer }) =>
        expect(@doc.readOnlyViews.length).to.equal(1)
        expect(@doc.interactiveView).to.equal(undefined)
        done()


    describe 'wrapper param', ->
      wrapper = '<div class="wrapper doc-section"></div>'
      checkWrapper = (renderer) ->
          expect(renderer.$wrapperHtml[0].outerHTML).to.equal(wrapper)

      it 'accepts a jquery wrapper as an argument', (done) ->
        @doc.createView( wrapper: $(wrapper) )
        .then ({ iframe, renderer }) =>
          checkWrapper(renderer)
          done()


      it 'accepts a DOM node wrapper as an argument', (done) ->
        @doc.createView( wrapper: $(wrapper)[0] )
        .then ({ iframe, renderer }) =>
          checkWrapper(renderer)
          done()


      it 'accepts a string wrapper as an argument', (done) ->
        @doc.createView( wrapper: wrapper)
        .then ({ iframe, renderer }) =>
          checkWrapper(renderer)
          done()


  describe 'appendTo()', ->

    beforeEach ->
      @$container = $('<div class="append-to-test-container">')
      $(document.body).append(@$container)
      @title = test.createComponent('title')
      @title.set('title', 'Hello Welt')
      @componentTree.append(@title)


    afterEach ->
      @$container.remove()


    it 'creates a readOnly view without an iframe', (done) ->
      @doc.appendTo(host: @$container).then ({ renderer }) =>
        expect(renderer.renderingContainer.isReadOnly).to.be.true
        done()


    it 'adds the content to the host element', (done) ->
      @doc.appendTo(host: @$container, layoutName: false).then ({ renderer }) =>
        renderer.ready =>
          expect(@$container.html()).to.have.html '
            <h1>Hello Welt</h1>
          '
          done()


    it 'adds the content to the host element with default layout', (done) ->
      @doc.appendTo(host: @$container).then ({ renderer }) =>
        renderer.ready =>
          expect(@$container.html()).to.have.html '
            <div class="doc-section layout-wrapper-extended">
              <h1>Hello Welt</h1>
            </div>
          '
          done()


    it 'adds the content to the host element with specified layout', (done) ->
      @doc.appendTo(host: @$container, layoutName: 'layout1').then ({ renderer }) =>
        renderer.ready =>
          expect(@$container.html()).to.have.html '
            <div class="doc-section layout-wrapper">
              <h1>Hello Welt</h1>
            </div>
          '
          done()


    it 'adds the content to the host element with specified wrapper', (done) ->
      @doc.appendTo(host: @$container, wrapper: '<div class="doc-section wrapper"></div>', layoutName: 'layout1').then ({ renderer }) =>
        renderer.ready =>
          expect(@$container.html()).to.have.html '
            <div class="doc-section wrapper">
              <h1>Hello Welt</h1>
            </div>
          '
          done()


  describe 'scripts in components', ->

    beforeEach (done) ->
      @componentTree = @doc.componentTree
      @html = test.createComponent('html')
      @html.set('source', '<script>scriptTest = "halleluja!";</script>')
      @componentTree.append(@html)
      @doc.createView()
      .then ({ @iframe, @renderer }) =>
        @renderer.ready =>
          done()


    it 'executes scripts in the iframe when components are added before createView()', ->
      expect(@iframe.contentWindow.scriptTest).to.equal('halleluja!')


    it 'executes scripts in the iframe when components are added after the renderer is ready', ->
      newHtml = test.createComponent('html')
      newHtml.set('source', '<script>otherScriptTest = "interesting!";</script>')
      @componentTree.append(newHtml)
      expect(@iframe.contentWindow.otherScriptTest).to.equal('interesting!')


    it 'executes scripts when content is updated', ->
      @iframe.contentWindow.scriptCounter = 0
      @html.set('source', '<script>scriptCounter += 1;</script>')
      expect(@iframe.contentWindow.scriptCounter).to.equal(1)


    it 'does not execute scripts when content is updated twice with the same value', ->
      @iframe.contentWindow.scriptCounter = 0
      @html.set('source', '<script>scriptCounter += 1;</script>')
      @html.set('source', '<script>scriptCounter += 1;</script>')
      expect(@iframe.contentWindow.scriptCounter).to.equal(1)


    it 'does execute scripts when content is updated with a different value', ->
      @iframe.contentWindow.scriptCounter = 0
      @html.set('source', '<script>scriptCounter += 1;</script>')
      @html.set('source', '<script>scriptCounter += 2;</script>')
      expect(@iframe.contentWindow.scriptCounter).to.equal(3)


    it 'does not execute scripts again when a different directive is updated', ->
      @iframe.contentWindow.scriptCounter = 0

      newHtml = test.createComponent('compositeHtml')
      @componentTree.append(newHtml)

      newHtml.set('source', '<script>scriptCounter += 1;</script>')
      newHtml.set('title', 'My counter script')

      expect(@iframe.contentWindow.scriptCounter).to.equal(1)

