Assets = require('../../../src/rendering_container/assets')
Dependency = require('../../../src/rendering/dependency')

# Helper methods
# --------------
toBase64Url = (code, mimetype) ->
  mimetype ?= 'text/javascript'
  base64Code = window.btoa(code)
  "data:#{ mimetype };base64,#{ base64Code }"


context 'assets:', ->

  describe 'constructor', ->

    it 'create a new instance', ->
      assets = new Assets(window: this)
      expect(assets).to.be.an.instanceof(Assets)


  context 'load js >', ->

    beforeEach (done) ->
      whenIframeLoaded = test.iframe.create()
      whenIframeLoaded.then (iframe) =>
        @iframeWindow = iframe.contentWindow
        @assets = new Assets(window: @iframeWindow)
        done()


    it 'loads a js script from a base64 src', (done) ->
      base64Url = toBase64Url('window.test = "base64";')
      dependency = new Dependency(src: base64Url, type: 'js')
      @assets.loadDependency dependency, =>
        expect(@iframeWindow.test).to.equal('base64')
        done()


    it 'does not load a js script from a base64 src twice', (done) ->
      base64Url = toBase64Url "
        window.counter = window.counter || 0;
        window.counter += 1;
      "
      dependency = new Dependency(src: base64Url, type: 'js')
      @assets.loadDependency dependency, =>
        dependency = new Dependency(src: base64Url, type: 'js')
        @assets.loadDependency dependency, =>
          expect(@iframeWindow.counter).to.equal(1)
        done()


    it 'loads an inline js code block', (done) ->
      dependency = new Dependency(code: 'window.test = "hilarious";', type: 'js')
      @assets.loadDependency dependency, =>
        expect(@iframeWindow.test).to.equal('hilarious')
        done()


    it 'does not load an inline js code block twice', (done) ->
      script = "
        window.counter = window.counter || 0;
        window.counter += 1;
      "
      dependency = new Dependency(code: script, type: 'js')
      @assets.loadDependency dependency, =>
        dependency = new Dependency(code: script, type: 'js')
        @assets.loadDependency dependency, =>
          expect(@iframeWindow.counter).to.equal(1)
          done()


  context 'load css >', ->

    beforeEach (done) ->
      whenIframeLoaded = test.iframe.create()
      whenIframeLoaded.then (iframe) =>
        @iframeWindow = iframe.contentWindow
        @assets = new Assets(window: @iframeWindow)

        @$elem = $('<div class="test-element">')
        @iframeWindow.document.body.appendChild(@$elem[0])

        done()


    it 'loads a css file from a base64 src', (done) ->
      base64Url = toBase64Url('.test-element { position: absolute; }', 'text/css')
      dependency = new Dependency(src: base64Url, type: 'css')

      @assets.loadDependency dependency, =>
        if @$elem.css('position') == 'absolute'
          done()
        else
          # Without the timeout Firefox fails this spec. Maybe
          # it is because of the base64 encoded stylesheet. That's
          # why I included this hack here instead of in the css loader.
          intervalId = setInterval =>
            if @$elem.css('position') == 'absolute'
              console.warn('Warning: Spec "loads a css file from a base64 src" is async')
              clearInterval(intervalId)
              done()
          , 0


    it 'loads inline css styles', (done) ->
      styles = '.test-element { position: absolute; }'
      dependency = new Dependency(code: styles, type: 'css')

      @assets.loadDependency dependency, =>
        expect( @$elem.css('position') ).to.equal('absolute')
        done()


  describe 'disable', ->

    beforeEach (done) ->
      whenIframeLoaded = test.iframe.create()
      whenIframeLoaded.then (iframe) =>
        @iframeWindow = iframe.contentWindow
        @assets = new Assets(window: @iframeWindow, disable: true)
        done()


    it 'does not load a js script if disabled', (done) ->
      dependency = new Dependency(code: 'window.test = "hilarious";', type: 'js')
      @assets.loadDependency dependency, =>
        expect(@iframeWindow.test).to.equal(undefined)
        done()
