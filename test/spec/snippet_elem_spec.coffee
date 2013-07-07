describe 'SnippetElem title', ->

  beforeEach ->
    @snippetElem = test.getTemplate('title').createHtml()


  describe 'set content', ->

    beforeEach ->
      @expected =
        """
        <h1 #{ docAttr.editable }="title"
          class="#{ docClass.editable } #{ docClass.snippet }" #{ docAttr.template }="test.title">
          Humble Bundle
        </h1>
        """


    it 'sets title', ->
      @snippetElem.set('title', 'Humble Bundle')
      expect( htmlCompare.compare(@snippetElem.$html, @expected) ).toBe(true)


    it 'updates its content from snippet', ->
      @snippetElem.snippet.set('title', 'Humble Bundle')
      @snippetElem.updateContent()
      expect( htmlCompare.compare(@snippetElem.$html, @expected) ).toBe(true)


    it 'sets title without editable name parameter', ->
      @snippetElem.set('Humble Bundle')
      expect( htmlCompare.compare(@snippetElem.$html, @expected) ).toBe(true)


  it 'gets the title', ->
    @snippetElem.set('Games Galore')
    expect( @snippetElem.get('title') ).toEqual('Games Galore')


  it 'gets the title without params', ->
    @snippetElem.set('Double Fine')
    expect( @snippetElem.get() ).toEqual('Double Fine')


describe 'SnippetElem hero', ->

  beforeEach ->
    snippet = test.getSnippet('hero')
    snippet.set('title', 'Humble Bundle 2')
    snippet.set('tagline', 'Get it now!')
    template = test.getTemplate('hero')
    @snippetElem = template.createHtml(snippet)
    @expected =
        """
        <div class="#{ docClass.snippet }" #{ docAttr.template }="test.hero">
          <h1 #{ docAttr.editable }="title" class="#{ docClass.editable }">Humble Bundle 2</h1>
          <p #{ docAttr.editable }="tagline" class="#{ docClass.editable }">Get it now!</p>
        </div>
        """

  it 'renders snippet content on creation', ->
    expect( htmlCompare.compare(@snippetElem.$html, @expected) ).toBe(true)


describe 'SnippetElem image', ->

  beforeEach ->
    snippet = test.getSnippet('image')
    snippet.set('image', 'http://www.lolcats.com/images/1.jpg')
    @snippetElem = snippet.template.createHtml(snippet)
    @expected =
        """
        <img src="http://www.lolcats.com/images/1.jpg"
          #{ docAttr.image }="image"
          class="#{ docClass.snippet }"
          #{ docAttr.template }="test.image">
        """

  it 'renders the image src', ->
    expect( htmlCompare.compare(@snippetElem.$html, @expected) ).toBe(true)

