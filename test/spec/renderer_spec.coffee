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
          <h4 #{ docAttr.editable }="title" class="#{ docClass.editable }">Titel</h4>
          <div #{ docAttr.image }="image" style="background-image:url(http://placehold.it/0x0/BEF56F/B2E668);">
            <h3 #{ docAttr.editable }="uppertitle" class="#{ docClass.editable }">Oberzeile</h3>
            <h2 #{ docAttr.editable }="maintitle" class="#{ docClass.editable }">Titel</h2>
          </div>
        </div>
        """
      expect( htmlCompare.compare(snippetView.$html, expected) ).toBe(true)


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


    # it 'inserts ui element after each container', ->
    #   @tree.eachContainer (container) =>
    #     container.ui().append($('<div>cornify!</div>'))

    #   # ui element for root
    #   expect( $(@fragment).children(':last').hasClass(docClass.interface) ).toEqual(true)

    #   # ui elements for row containers
    #   $rowContainers = $(@fragment).find("[#{ docAttr.container }]")
    #   expect( $rowContainers.children(".#{ docClass.interface }").length ).toEqual(2)


    # it 'inserts ui element before the title snippet', ->
    #   @title.ui().before($('<div>cornify!</div>'))
    #   $title = $(@fragment).find(".#{ docClass.snippet } .#{ docClass.snippet }")
    #   expect($title.prev(".#{ docClass.interface }").length).toEqual(1)
    #   expect($title.next(".#{ docClass.interface }").length).toEqual(0)


    # it 'inserts ui element after the title snippet', ->
    #   @title.ui().after($('<div>cornify!</div>'))
    #   $title = $(@fragment).find(".#{ docClass.snippet } .#{ docClass.snippet }")
    #   expect($title.prev(".#{ docClass.interface }").length).toEqual(0)
    #   expect($title.next(".#{ docClass.interface }").length).toEqual(1)

    # it 'destroys ui element', ->
    #   @title.ui().after($('<div>cornify!</div>'))
    #   expect( $(@fragment).find(".#{ docClass.interface }").length ).toEqual(1)
    #   @title.remove()
    #   expect( $(@fragment).find(".#{ docClass.interface }").length ).toEqual(0)

