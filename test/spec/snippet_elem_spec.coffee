describe 'SnippetView title', ->

  describe 'set content', ->

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
      expect( htmlCompare.compare(@snippetView.$html, @expected) ).toBe(true)


    it 'updates its content from snippet', ->
      @snippetView.model.set('title', 'Humble Bundle')
      @snippetView.updateContent()
      expect( htmlCompare.compare(@snippetView.$html, @expected) ).toBe(true)


    it 'sets title without editable name parameter', ->
      @snippetView.set('Humble Bundle')
      expect( htmlCompare.compare(@snippetView.$html, @expected) ).toBe(true)


    it 'gets the title', ->
      @snippetView.set('Games Galore')
      expect( @snippetView.get('title') ).toEqual('Games Galore')


    it 'gets the title without params', ->
      @snippetView.set('Double Fine')
      expect( @snippetView.get() ).toEqual('Double Fine')


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
    expect( htmlCompare.compare(snippetView.$html, @expected) ).toBe(true)


  it 'changes "Color" style from "color--blue" to "color--red"', ->
    @expected.addClass('color--red')
    snippetView = @title.template.createView(@title)
    snippetView.style('Color', 'color--red')
    expect( htmlCompare.compare(snippetView.$html, @expected) ).toBe(true)


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
    expect( htmlCompare.compare(@snippetView.$html, @expected) ).toBe(true)


  it 'sets "Extra Space"', ->
    @expected.addClass('extra-space')
    @snippetView.style('Extra Space', 'extra-space')
    expect( htmlCompare.compare(@snippetView.$html, @expected) ).toBe(true)


describe 'SnippetView image', ->

  beforeEach ->
    snippet = test.getSnippet('image')
    snippet.set('image', 'http://www.lolcats.com/images/1.jpg')
    @snippetView = snippet.template.createView(snippet)
    @expected =
        """
        <img src="http://www.lolcats.com/images/1.jpg"
          #{ docAttr.image }="image"
          class="#{ docClass.snippet }"
          #{ docAttr.template }="test.image">
        """

  it 'renders the image src', ->
    expect( htmlCompare.compare(@snippetView.$html, @expected) ).toBe(true)

