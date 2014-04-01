ImageManager = require('../../../src/rendering/image_manager')
TestImage = require('../../support/test_base64_image')

css = config.css
attr = config.attr

describe 'SnippetView', ->

  describe 'title', ->

    beforeEach ->
      @snippetView = test.getTemplate('title').createView()
      @expected = $ """
        <h1 #{ test.editableAttr }="title"
          class="#{ css.editable } #{ css.snippet }"
            #{ attr.template }="test.title"
            #{ test.emptyPlaceholderAttr }>
          Humble Bundle
        </h1>
        """


    it 'sets title', ->
      @snippetView.set('title', 'Humble Bundle')
      expect(@snippetView.$html).to.have.html(@expected)


    describe 'when clearing an existing value', ->
      it 'clears the html', ->
        @snippetView.set('title', 'foobar')
        @snippetView.set('title', undefined)
        @expected.html('')
        expect(@snippetView.$html).to.have.html(@expected)


    it 'renders content from the model', ->
      @snippetView.model.set('title', 'Humble Bundle')
      @snippetView.render()
      expect(@snippetView.$html).to.have.html(@expected)


    it 'gets the title', ->
      @snippetView.set('title', 'Games Galore')
      expect( @snippetView.get('title') ).to.equal('Games Galore')


describe 'SnippetView title set style', ->

  beforeEach ->
    @title = test.getSnippet('title')
    @title.style('Color', 'color--blue')
    @$expected = $ """
      <h1 #{ test.editableAttr }="title"
          class="#{ css.editable } #{ css.snippet }"
          #{ attr.template }="test.title">
      </h1>"""

  it 'sets "Color" style to "color--blue"', ->
    @$expected.addClass('color--blue')
    snippetView = @title.template.createView(@title)
    expect(snippetView.$html).to.have.html(@$expected)


  it 'changes "Color" style from "color--blue" to "color--red"', ->
    @$expected.addClass('color--red')
    snippetView = @title.template.createView(@title)
    snippetView.style('Color', 'color--red')
    expect(snippetView.$html).to.have.html(@$expected)


describe 'SnippetView hero', ->

  beforeEach ->
    snippet = test.getSnippet('hero')
    snippet.set('title', 'Humble Bundle 2')
    snippet.set('tagline', 'Get it now!')
    template = test.getTemplate('hero')
    @snippetView = template.createView(snippet)
    @expected = $ """
      <div  class="#{ css.snippet }"
            #{ attr.template }="test.hero">
        <h1 #{ test.editableAttr }="title"
            class="#{ css.editable }"
            #{ test.emptyPlaceholderAttr }>Humble Bundle 2</h1>
        <p  #{ test.editableAttr }="tagline"
            class="#{ css.editable }"
            #{ test.emptyPlaceholderAttr }>Get it now!</p>
      </div>"""


  it 'renders snippet content on creation', ->
    expect(@snippetView.$html).to.have.html(@expected)


  it 'sets "Extra Space"', ->
    @expected.addClass('extra-space')
    @snippetView.style('Extra Space', 'extra-space')
    expect(@snippetView.$html).to.have.html(@expected)


  it 'resets "Extra Space"', ->
    @snippetView.style('Extra Space', 'extra-space')
    @snippetView.style('Extra Space', '')
    expect(@snippetView.$html).to.have.html(@expected)


  describe 'empty optional', ->

    beforeEach ->
      @snippetView.model.set('tagline', undefined)
      @snippetView.render()
      @expected.find('p').hide().html('')


    it 'is hidden by default', ->
      expect(@snippetView.$html).to.have.html(@expected)


    # In doubt delete this test (strongly tied to implementation)
    #
    # Does not work with JSDOM 10.1 on node:
    # TypeError: Cannot call method 'match' of undefined
    # The same error has already an issue: https://github.com/tmpvar/jsdom/issues/709
    it.skip 'is revealed after view is focused', ->
      @snippetView.afterFocused()
      expect(@snippetView.$html.find('p').css('display')).not.to.equal('none')


describe 'SnippetView image', ->

  beforeEach ->
    @snippet = test.getSnippet('image')
    @defaultImageManager = ImageManager.getDefaultImageManager()
    @resrcitImageManager = ImageManager.getResrcitImageManager()
    @setOnDefault = sinon.spy(@defaultImageManager, 'set')
    @setOnResrcit = sinon.spy(@resrcitImageManager, 'set')


  afterEach ->
    @defaultImageManager.set.restore()
    @resrcitImageManager.set.restore()


  describe 'without an image service', ->

    it 'calls the default image manager', ->
      @snippet.set('image', 'http://www.lolcats.com/images/1.jpg')
      @snippetView = @snippet.template.createView(@snippet)
      expect(@setOnDefault).to.have.been.calledOnce


  describe 'with the resrc.it service', ->

    beforeEach ->
      @snippet.data 'imageService':
        'image': 'resrc.it'


    it 'calls the resrcit image manager', ->
      @snippet.set('image', 'http://www.lolcats.com/images/1.jpg')
      @snippetView = @snippet.template.createView(@snippet)
      expect(@setOnResrcit).to.have.been.calledOnce


  describe 'delayed placeholder insertion', ->

    beforeEach ->
      @view = @snippet.template.createView(@snippet)
      @view.set('image', undefined)


    it 'does not insert placeholders before view is attached', ->
      expect(@view.$html).to.have.html """
        <img src=""
          #{ test.imageAttr }="image"
          class="#{ css.snippet }"
          #{ attr.template }="test.image">"""


    it 'inserts placeholder when view is attached', ->
      placeholderUrl = 'http://placehold.it/0x0/BEF56F/B2E668'
      @view.wasAttachedToDom.fireWith(@view.$html)

      expect(@view.$html).to.have.html """
        <img src="#{ placeholderUrl }"
          #{ test.imageAttr }="image"
          class="#{ css.snippet } doc-image-empty"
          #{ attr.template }="test.image">"""


    it 'does not re-insert placeholders if value is set later on', ->
      imageUrl = 'http://www.bla.com'
      @view.set('image', imageUrl)
      @view.wasAttachedToDom.fireWith(@view.$html)

      expect(@view.$html).to.have.html """
        <img src="#{ imageUrl }"
          #{ test.imageAttr }="image"
          class="#{ css.snippet }"
          #{ attr.template }="test.image">"""


    it 'remove the empty image css class when the image is set', ->
      placeholderUrl = 'http://placehold.it/0x0/BEF56F/B2E668'
      imageUrl = 'http://www.bla.com'
      @view.wasAttachedToDom.fireWith(@view.$html)
      @view.set('image', imageUrl)

      expect(@view.$html).to.have.html """
        <img src="#{ imageUrl }"
          #{ test.imageAttr }="image"
          class="#{ css.snippet }"
          #{ attr.template }="test.image">"""


describe 'SnippetView html', ->

  beforeEach ->
    @snippet = test.getSnippet('html')
    @snippet.set('html', '<section>test</section>')
    @view = @snippet.createView()
    # There is additional code by the interaction blocker element in there
    # which is not nice but hopefully works out just fine.
    @expected = $ """
      <div class="#{ css.snippet }"
        #{ attr.template }="test.html"
        #{ test.htmlAttr }="html"
        style="position: relative; ">
        <section>test</section>
        <div class="doc-interaction-blocker" style="position: absolute; top: 0; bottom: 0; left: 0; right: 0;"></div>
      </div>
      """


  describe 'set("html", value)', ->
    it 'adds the html to the snippet', ->
      expect(@view.$html).to.have.html(@expected)

    describe 'when clearing an existing value', ->
      it 'inserts the default value', ->
        @snippet.set('html', undefined)
        @view.render()
        @expected.html(@snippet.template.defaults['html'])
        expect(@view.$html).to.have.html(@expected)


describe 'using volatile values', ->

  beforeEach ->
    @snippet = test.getSnippet('image')
    @snippet.set('image', TestImage, true)
    @view = @snippet.createView()


  it 'uses a temporary base64 value if there is no image set', ->
    @view.render()
    expect(@view.$html).to.have.attr('src', TestImage)


  it 'uses a temporary base64 value if the image src is empty string', ->
    @snippet.set('image', '')
    @view.render()
    expect(@view.$html).to.have.attr('src', TestImage)


  it 'uses the image content if it is set', ->
    @snippet.set('image', 'http://www.lolcats.com/images/u/12/24/lolcatsdotcompromdate.jpg')
    @view.render()
    expect(@view.$html).to.have.attr('src', 'http://www.lolcats.com/images/u/12/24/lolcatsdotcompromdate.jpg')

