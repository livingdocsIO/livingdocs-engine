Renderer = require('../../../src/rendering/renderer')
SnippetTree = require('../../../src/snippet_tree/snippet_tree')
Page = require('../../../src/rendering_container/page')
attr = config.attr
css = config.css

describe 'Renderer', ->

  describe 'in interactive mode', ->

    beforeEach (done) ->
      { @componentTree } = getInstances('componentTree')
      @page = new Page
        renderNode: $('<section>')
        readOnly: false

      @renderer = new Renderer(componentTree: @componentTree, renderingContainer: @page)
      @renderer.ready -> done()


    describe 'with a single title snippet', ->

      beforeEach ->
        @title = test.createSnippet('title', 'A')
        @componentTree.append(@title)


      it 'renders the title', ->
        expect(@page.renderNode).to.have.html """
          <section>
            <h1
              class="#{ css.snippet } #{ css.editable } #{ css.noPlaceholder }"
              #{ attr.template }="test.title"
              #{ test.editableAttr }="title"
              #{ attr.placeholder }="#{ @title.template.defaults['title'] }">A</h1>
          </section>"""


      it 'can remove the title again', ->
        @title.remove()
        expect(@page.renderNode).to.have.html """
          <section></section>"""


  describe 'insertSnippet()', ->
    beforeEach (done) ->
      { @componentTree, @page, @renderer } = getInstances('page', 'renderer')
      @renderer.ready -> done()

    it 'insertes the already appended snippets of an inserted snippet', ->
      container = test.getSnippet('container')
      title = test.createSnippet('title', 'A')
      container.append(config.directives.container.defaultName, title)
      @componentTree.append(container)
      expect(@page.renderNode).to.have.html """
        <section>
          <div class="container">
            <div>
              <h1>A</h1>
            </div>
          </div>
        </section>"""


  describe 'in readonly mode', ->
    beforeEach (done) ->
      { @componentTree, @page, @renderer } = getInstances('page', 'renderer')
      @renderer.ready -> done()


    describe 'with a title', ->

      beforeEach ->
        @title = test.createSnippet('title', 'A')
        @componentTree.append(@title)


      it 'renders the title into the page', ->
        expect(@page.renderNode).to.have.html """
          <section>
            <h1>A</h1>
          </section>"""


      describe 'renderer.html()', ->

        it 'returns the html', (done) ->
          @renderer.ready =>
            expect(@renderer.html()).to.have.html """
              <h1>A</h1>
            """
            done()


    describe 'with a hero', ->

      beforeEach ->
        @hero = test.createSnippet('hero')
        @componentTree.append(@hero)


      describe 'with no content', ->

        it 'renders the optional field invisibly', ->
          expect(@page.renderNode).to.have.html """
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
          expect(@page.renderNode).to.have.html """
            <section>
              <div>
                <h1>A</h1>
                <p>B</p>
              </div>
            </section>"""


    describe 'with three nested snippets', ->

      beforeEach ->
        row = test.getSnippet('row')
        @componentTree.append(row)
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
        expect(@page.renderNode).to.have.html """
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


    describe 'with a doc-html directive', ->

      beforeEach ->
        html = test.createSnippet('html', '<article>html</article>')
        @componentTree.append(html)


      it 'does not block interaction in readOnly mode', ->
        expect(@page.renderNode).to.have.html """
          <section>
            <div>
              <article>html</article>
            </div>
          </section>
          """

  describe 'with a wrapper', ->
    beforeEach ->
      { @componentTree, @page, @renderer } = getInstances('componentTree', 'page')
      @renderer = new Renderer
        componentTree: @componentTree
        renderingContainer: @page
        $wrapper: $ """
          <div>
            <section class="#{ css.section }">
            </section>
          </div>"""


    it 'appends the wrapper', (done) ->
      @renderer.ready =>
        expect(@page.renderNode).to.have.html """
          <section>
            <div>
              <section class="#{ css.section }"></section>
            </div>
          </section>
          """
        done()


    it 'appends content wrapper to the wrapper', (done) ->
      title = test.createSnippet('title', 'ABC')
      @componentTree.append(title)

      @renderer.ready =>
        expect(@page.renderNode).to.have.html """
          <section>
            <div>
              <section class="#{ css.section }">
                <h1>ABC</h1>
              </section>
            </div>
          </section>
          """
        done()

