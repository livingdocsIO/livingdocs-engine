describe 'renderer', ->

  beforeEach ->
    @tree = new SnippetTree()
    page = new PageMock()
    @fragment = $(page.renderNode)
    @renderer = new Renderer(snippetTree: @tree, page: page)


  describe 'for a few snippets', ->

    beforeEach ->
      row = test.getSnippet('row')
      @tree.append(row)
      @title = test.getSnippet('title')
      @title.set('title', 'Singing in the Rain')
      row.append('main', @title)
      @cover = test.getSnippet('cover')
      row.append('main', @cover)


    it 'renders row and title snippet', ->
      expect( $(@fragment).find(".#{ docClass.snippet }").length).toEqual(3)


    it 'renders cover snippet with a placeholder image', ->
      snippetView = @renderer.getSnippetView(@cover)
      expected =
        """
        <div class="#{ docClass.snippet }" #{ docAttr.template }="test.cover">
          <h4 #{ test.editableAttr }="title" class="#{ docClass.editable }"
            #{ docAttr.placeholder }="Titel"></h4>
          <div #{ test.imageAttr }="image" style="background-image:url(http://placehold.it/0x0/BEF56F/B2E668);">
            <h3 #{ test.editableAttr }="uppertitle" class="#{ docClass.editable }"
              #{ docAttr.placeholder }="Oberzeile"></h3>
            <h2 #{ test.editableAttr }="maintitle" class="#{ docClass.editable }"
              #{ docAttr.placeholder }="Titel"></h2>
          </div>
        </div>
        """
      expect(snippetView.$html).toLookLike(expected)


    describe 'getSnippetView()', ->

      it 'gets snippetView for title', ->
        expect(@renderer.getSnippetView(@title)).toBeDefined()


      it 'returns undefined when called without any parameter', ->
        expect(@renderer.getSnippetView()).toBeUndefined()


      it 'returns undefined for a new snippet', ->
        anotherTitle = test.getSnippet('title')
        expect(@renderer.getSnippetView(anotherTitle)).toBeUndefined()


    describe 'ensureSnippetView()', ->

      it 'returns the same instance as getSnippetView()', ->
        snippetView = @renderer.getSnippetView(@title)
        expect(@renderer.ensureSnippetView(@title)).toBe(snippetView)


      it 'returns undefined when called without any parameter', ->
        expect(@renderer.ensureSnippetView()).toBeUndefined()


      it 'creates snippetView for a new snippet', ->
        anotherTitle = test.getSnippet('title')
        expect(@renderer.getSnippetView(anotherTitle)).toBeUndefined()
        anotherTitleElem = @renderer.ensureSnippetView(anotherTitle)
        expect(anotherTitleElem).toBeDefined()
        expect(@renderer.getSnippetView(anotherTitle)).toBe(anotherTitleElem)

