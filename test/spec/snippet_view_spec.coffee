describe 'SnippetView', ->

  describe 'title', ->

    beforeEach ->
      @snippetView = test.getTemplate('title').createView()
      @expected =
        """
        <h1 #{ docAttr.editable }="title"
          class="#{ docClass.editable } #{ docClass.snippet }" #{ docAttr.template }="test.title">
          Humble Bundle
        </h1>
        """


    it 'sets title', ->
      @snippetView.set('title', 'Humble Bundle')
      expect(@snippetView.$html).toLookLike(@expected)


    it 'updates its content from snippet', ->
      @snippetView.model.set('title', 'Humble Bundle')
      @snippetView.updateContent()
      expect(@snippetView.$html).toLookLike(@expected)


    it 'gets the title', ->
      @snippetView.set('title', 'Games Galore')
      expect( @snippetView.get('title') ).toEqual('Games Galore')


describe 'SnippetView title set style', ->

  beforeEach ->
    @title = test.getSnippet('title')
    @title.style('Color', 'color--blue')
    @expected = $(
      """
      <h1 #{ docAttr.editable }="title"
        class="#{ docClass.editable } #{ docClass.snippet }" #{ docAttr.template }="test.title">
      </h1>
      """
    )

  it 'sets "Color" style to "color--blue"', ->
    @expected.addClass('color--blue')
    snippetView = @title.template.createView(@title)
    expect(snippetView.$html).toLookLike(@expected)


  it 'changes "Color" style from "color--blue" to "color--red"', ->
    @expected.addClass('color--red')
    snippetView = @title.template.createView(@title)
    snippetView.style('Color', 'color--red')
    expect(snippetView.$html).toLookLike(@expected)


describe 'SnippetView hero', ->

  beforeEach ->
    snippet = test.getSnippet('hero')
    snippet.set('title', 'Humble Bundle 2')
    snippet.set('tagline', 'Get it now!')
    template = test.getTemplate('hero')
    @snippetView = template.createView(snippet)
    @expected = $(
      """
      <div class="#{ docClass.snippet }" #{ docAttr.template }="test.hero">
        <h1 #{ docAttr.editable }="title" class="#{ docClass.editable }">Humble Bundle 2</h1>
        <p #{ docAttr.editable }="tagline" class="#{ docClass.editable }">Get it now!</p>
      </div>
      """
    )

  it 'renders snippet content on creation', ->
    expect(@snippetView.$html).toLookLike(@expected)


  it 'sets "Extra Space"', ->
    @expected.addClass('extra-space')
    @snippetView.style('Extra Space', 'extra-space')
    expect(@snippetView.$html).toLookLike(@expected)


  it 'resets "Extra Space"', ->
    @snippetView.style('Extra Space', 'extra-space')
    @snippetView.style('Extra Space', '')
    expect(@snippetView.$html).toLookLike(@expected)


describe 'SnippetView image', ->

  beforeEach ->
    @snippet = test.getSnippet('image')


  it 'renders the image src', ->
    @snippet.set('image', 'http://www.lolcats.com/images/1.jpg')
    @snippetView = @snippet.template.createView(@snippet)
    @expected =
      """
      <img src="http://www.lolcats.com/images/1.jpg"
        #{ docAttr.image }="image"
        class="#{ docClass.snippet }"
        #{ docAttr.template }="test.image">
      """
    expect(@snippetView.$html).toLookLike(@expected)


  describe 'delayed placeholder insertion', ->

    beforeEach ->
      @view = @snippet.template.createView(@snippet)
      @view.set('image', undefined)


    it 'does not insert placeholders before view is attached', ->
      expected =
        """
        <img src=""
          #{ docAttr.image }="image"
          class="#{ docClass.snippet }"
          #{ docAttr.template }="test.image">
        """
      expect(@view.$html).toLookLike(expected)


    it 'inserts placeholder when view is attached', ->
      placeholderUrl = 'http://placehold.it/0x0/BEF56F/B2E668'
      expected =
        """
        <img src="#{ placeholderUrl }"
          #{ docAttr.image }="image"
          class="#{ docClass.snippet }"
          #{ docAttr.template }="test.image">
        """

      @view.wasAttachedToDom.fireWith(@view.$html)
      expect(@view.$html).toLookLike(expected)


    it 'does not re-insert placeholders if value is set later on', ->
      imageUrl = 'http://www.bla.com'
      expected =
        """
        <img src="#{ imageUrl }"
          #{ docAttr.image }="image"
          class="#{ docClass.snippet }"
          #{ docAttr.template }="test.image">
        """

      @view.set('image', imageUrl)
      @view.wasAttachedToDom.fireWith(@view.$html)
      expect(@view.$html).toLookLike(expected)


describe 'SnippetView background image', ->

  beforeEach ->
    @coverSnippet = test.getSnippet('cover')


  it 'renders the background image', ->
    @coverSnippet.set('image', 'http://www.lolcats.com/images/u/11/39/lolcatsdotcomaptplf8mvc1o2ldb.jpg')
    snippetView = @coverSnippet.template.createView(@coverSnippet)
    expected =
      """
      <div class="#{ docClass.snippet }" #{ docAttr.template }="test.cover">
        <h4 #{ docAttr.editable }="title" class="#{ docClass.editable }">Titel</h4>
        <div #{ docAttr.image }="image" style="background-image:url(http://www.lolcats.com/images/u/11/39/lolcatsdotcomaptplf8mvc1o2ldb.jpg);">
          <h3 #{ docAttr.editable }="uppertitle" class="#{ docClass.editable }">Oberzeile</h3>
          <h2 #{ docAttr.editable }="maintitle" class="#{ docClass.editable }">Titel</h2>
        </div>
      </div>
      """
    expect(snippetView.$html).toLookLike(expected)


describe 'SnippetView html', ->

  beforeEach ->
    @snippet = test.getSnippet('html')
    @snippet.set('html', '<section>test</section>')
    @view = @snippet.template.createView(@snippet)


  describe 'set("html", value)', ->
    it 'adds the html to the snippet', ->
      expect(@view.$html).toLookLike(

        # There is additional code by the interaction blocker element in there
        # which is not nice but hopefully works out just fine.
        """
        <div class="#{ docClass.snippet }"
          #{ docAttr.template }="test.html"
          #{ docAttr.html }="html"
          style="position: relative; ">
          <section>test</section>
          <div class="doc-interaction-blocker" style="position: absolute; top: 0; bottom: 0; left: 0; right: 0; z-index: 1000;"></div>
        </div>
        """
      )

