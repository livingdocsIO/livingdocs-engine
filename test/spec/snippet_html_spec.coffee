describe 'SnippetHtml', ->

  beforeEach ->
    @snippet = test.getSnippet('title')
    @snippetHtml = @snippet.createHtml()


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
      @snippetHtml.set('title', 'Humble Bundle')
      expect( htmlCompare.compare(@snippetHtml.$html, @expected) ).toBe(true)


    it 'updates its content from snippet', ->
      @snippet.set('title', 'Humble Bundle')
      @snippetHtml.updateContent()
      expect( htmlCompare.compare(@snippetHtml.$html, @expected) ).toBe(true)


    it 'sets title without editable name parameter', ->
      @snippetHtml.set('Humble Bundle')
      expect( htmlCompare.compare(@snippetHtml.$html, @expected) ).toBe(true)


  it 'gets the title', ->
    @snippetHtml.set('Games Galore')
    expect( @snippetHtml.get('title') ).toEqual('Games Galore')


  it 'gets the title without params', ->
    @snippetHtml.set('Double Fine')
    expect( @snippetHtml.get() ).toEqual('Double Fine')


describe 'SnippetHtml', ->

  beforeEach ->
    @snippet = test.getSnippet('hero')
    @snippet.set('title', 'Humble Bundle 2')
    @snippet.set('tagline', 'Get it now!')
    @snippetHtml = @snippet.createHtml()
    @expected =
        """
        <div class="#{ docClass.snippet }" #{ docAttr.template }="test.hero">
          <h1 #{ docAttr.editable }="title" class="#{ docClass.editable }">Humble Bundle 2</h1>
          <p #{ docAttr.editable }="tagline" class="#{ docClass.editable }">Get it now!</p>
        </div>
        """

  it 'renders snippet content on creation', ->
    expect( htmlCompare.compare(@snippetHtml.$html, @expected) ).toBe(true)

