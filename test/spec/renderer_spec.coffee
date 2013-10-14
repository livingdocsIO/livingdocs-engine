describe 'Not ReadOnly Renderer', ->

  beforeEach ->
    @tree = new SnippetTree()
    @page = new Page
      renderNode: $('<section>')
      readOnly: false

    @renderer = new Renderer(snippetTree: @tree, renderingContainer: @page)


  describe 'with a single title snippet', ->

    beforeEach ->
      @title = test.createSnippet('title', 'A')
      @tree.append(@title)


    it 'renders the title', ->
      expect(@page.renderNode).toEqualHtmlOf """
        <section>
          <h1
            class="#{ docClass.snippet } #{ docClass.editable }"
            #{ docAttr.template }="test.title"
            #{ test.editableAttr }="title"
            #{ test.emptyPlaceholderAttr }>A</h1>
        </section>"""


    it 'can remove the title again', ->
      @title.remove()
      expect(@page.renderNode).toEqualHtmlOf """
        <section></section>"""


describe 'ReadOnly Renderer', ->

  beforeEach ->
    @tree = new SnippetTree()
    @page = new Page
      renderNode: $('<section>')

    @renderer = new Renderer(snippetTree: @tree, renderingContainer: @page)


  describe 'with a title', ->

    beforeEach ->
      @title = test.createSnippet('title', 'A')
      @tree.append(@title)


    it 'renders the title', ->
      expect(@page.renderNode).toEqualHtmlOf """
        <section>
          <h1>A</h1>
        </section>"""


  describe 'with a hero', ->

    beforeEach ->
      @hero = test.createSnippet('hero')
      @tree.append(@hero)


    describe 'with no content', ->

      it 'renders the optional field invisibly', ->
        expect(@page.renderNode).toEqualHtmlOf """
          <section>
            <div>
              <h1></h1>
              <p style="display: none;"></p>
            </div>
          </section>"""


    describe 'with content', ->

      it 'renders the optional field visibly', ->
        @hero.set('title', 'A')
        @hero.set('tagline', 'B')
        expect(@page.renderNode).toEqualHtmlOf """
          <section>
            <div>
              <h1>A</h1>
              <p>B</p>
            </div>
          </section>"""


  describe 'with three nested snippets', ->

    beforeEach ->
      row = test.getSnippet('row')
      @tree.append(row)
      @title = test.getSnippet('title')
      @title.set('title', 'Title')
      row.append('main', @title)
      @cover = test.getSnippet('cover')
      @cover.set('title', 'Cover')
      @cover.set('uppertitle', 'Uppertitle')
      @cover.set('maintitle', 'Maintitle')
      @cover.set('image', 'http://www.image.com/1')
      row.append('main', @cover)


    it 'renders row, title and cover snippet', ->
      expect(@page.renderNode).toEqualHtmlOf """
        <section>
          <div class="row-fluid">
            <div class="span8">
              <h1>Title</h1>
              <div>
                <h4>Cover</h4>
                <div style="background-image:url(http://www.image.com/1)">
                  <h3>Uppertitle</h3>
                  <h2>Maintitle</h2>
                </div>
              </div>
            </div>
            <div class="span4"></div>
          </div>
        </section>"""

