$ = require('jquery')
base64Image = require('../../support/test_base64_image')

css = test.config.css
attr = test.config.attr

describe 'component_view:', ->

  describe 'title view', ->

    beforeEach ->
      @view = test.getTemplate('title').createView()
      @expected = $ """
        <h1 #{ test.editableAttr }="title"
          class="#{ css.editable } #{ css.component }"
            #{ attr.template }="test.title"
            #{ attr.placeholder }="#{ @view.template.defaults['title'] }">
        </h1>
        """


    it 'sets title', ->
      @view.set('title', 'Humble Bundle')
      @expected.addClass(css.noPlaceholder)
      @expected.html('Humble Bundle')
      expect(@view.$html).to.have.html(@expected)


    describe 'when clearing an existing value', ->
      it 'clears the html', ->
        @view.set('title', 'foobar')
        @view.set('title', undefined)
        expect(@view.$html[0]).to.have.html(@expected[0])


    it 'renders content from the model', ->
      @view.model.set('title', 'Humble Bundle')
      @view.render()
      @expected.addClass(css.noPlaceholder)
      @expected.html('Humble Bundle')
      expect(@view.$html).to.have.html(@expected)


    it 'gets the title', ->
      @view.set('title', 'Games Galore')
      expect( @view.get('title') ).to.equal('Games Galore')


  describe 'of a title component', ->

    beforeEach ->
      @title = test.getComponent('title')
      @$expected = $ """
        <h1 #{ test.editableAttr }="title"
            class="#{ css.editable } #{ css.component }"
            #{ attr.template }="test.title"
            #{ attr.placeholder }="#{ @title.template.defaults['title'] }">
        </h1>"""


    describe 'recreateHtml()', ->

      it 'resets changes made in the views html', ->
        view = @title.createView()
        view.$html.addClass('test-class')
        view.recreateHtml()
        expect(view.$html).to.have.html(@$expected)


    describe 'updates the style', ->

      it 'sets "color" style to "color--blue"', ->
        @title.setStyle('color', 'color--blue')
        @$expected.addClass('color--blue')
        componentView = @title.createView()
        expect(componentView.$html).to.have.html(@$expected)


      it 'changes "color" style from "color--blue" to "color--red"', ->
        @title.setStyle('color', 'color--blue')
        @$expected.addClass('color--red')
        componentView = @title.createView()
        componentView.setStyle('color', 'color--red')
        expect(componentView.$html).to.have.html(@$expected)


  describe 'of a hero component', ->

    beforeEach ->
      component = test.getComponent('hero')
      component.set('title', 'Humble Bundle 2')
      component.set('tagline', 'Get it now!')
      @view = component.createView()
      @expected = $ """
        <div  class="#{ css.component }"
              #{ attr.template }="test.hero">
          <h1 #{ test.editableAttr }="title"
              class="#{ css.editable } #{ css.noPlaceholder }"
              #{ attr.placeholder }="#{ @view.template.defaults['title'] }">Humble Bundle 2</h1>
          <p  #{ test.editableAttr }="tagline"
              class="#{ css.editable } #{ css.noPlaceholder }"
              #{ attr.placeholder }="#{ @view.template.defaults['tagline'] }">Get it now!</p>
        </div>"""


    it 'renders component content on creation', ->
      expect(@view.$html).to.have.html(@expected)


    it 'sets "extra-space"', ->
      @expected.addClass('extra-space')
      @view.setStyle('extra-space', 'extra-space')
      expect(@view.$html).to.have.html(@expected)


    it 'resets "extra-space"', ->
      @view.setStyle('extra-space', 'extra-space')
      @view.setStyle('extra-space', '')
      expect(@view.$html).to.have.html(@expected)


    it 'set(directiveName) does only update the passed directive', ->
      @view.model.set('title', 'bla')
      spy = sinon.spy(@view, 'set')
      @view.updateContent('title')
      expect(spy.callCount).to.equal(1)
      expect(spy.firstCall.args[0]).to.equal('title')


    describe 'empty optional', ->

      beforeEach ->
        @view.model.set('tagline', undefined)
        @view.render()
        @expected.find('p').hide().html('')
        @expected.find('p').removeClass(css.noPlaceholder)


      it 'is hidden by default', ->
        expect(@view.$html).to.have.html(@expected)


  describe 'of a link component', ->

    it 'sets the href of the directive', ->

      expectedHtml = """
        <div class="#{ css.component }"
          #{ attr.template }="test.related-article"
          >

          <a #{ test.linkAttr }="article-link" href="http://upfront.io">
            <h2 class="#{ css.editable }"
              #{ test.editableAttr }="article-title"
              #{ attr.placeholder }="">
            </h2>
          </a>
        </div>
      """

      component = test.getComponent('related-article')
      component.set('article-link', 'http://upfront.io')
      view = component.createView()
      expect(view.$html).to.have.html(expectedHtml)


  describe 'of an image component', ->

    beforeEach ->
      @component = test.getComponent('image')


    describe 'with the default image service', ->

      expectSrc = (view, src) ->
        expect(view.$html).to.have.html """
          <img src="#{ src }"
            #{ test.imageAttr }="image"
            class="#{ css.component }"
            #{ attr.template }="test.image">"""


      it 'sets the src', ->
        @component.set('image', 'http://images.com/1')
        @view = @component.createView()
        @view.updateContent('image')
        expectSrc(@view, 'http://images.com/1')


    describe 'with the resrc.it image service', ->

      it 'sets the data-src attribute', ->
        @view = @component.createView()
        @view.model.directives.get('image').setImageService('resrc.it')
        @component.set('image', 'http://images.com/1')
        @view.updateContent('image')
        expect(@view.$html).to.have.html """
          <img
            src=""
            data-src="https://app.resrc.it/O=75/http://images.com/1"
            class="#{ css.component } resrc"
            #{ test.imageAttr }="image"
            #{ attr.template }="test.image">
            """

    describe 'delayed placeholder insertion', ->

      beforeEach ->
        @view = @component.createView()
        @view.set('image', undefined)


      it 'does not insert placeholders before view is attached', ->
        expect(@view.$html).to.have.html """
          <img src=""
            #{ test.imageAttr }="image"
            class="#{ css.component }"
            #{ attr.template }="test.image">"""


      it 'inserts placeholder when view is attached', ->
        placeholderUrl = test.config.imagePlaceholder
        @view.wasAttachedToDom.fireWith(@view.$html)

        expect(@view.$html).to.have.html """
          <img src="#{ placeholderUrl }"
            #{ test.imageAttr }="image"
            class="#{ css.component } doc-image-empty"
            #{ attr.template }="test.image">"""


      it 'does not re-insert placeholders if value is set later on', ->
        imageUrl = 'http://www.bla.com'
        @component.set('image', imageUrl)
        @view.updateContent('image')
        @view.wasAttachedToDom.fireWith(@view.$html)

        expect(@view.$html).to.have.html """
          <img src="#{ imageUrl }"
            #{ test.imageAttr }="image"
            class="#{ css.component }"
            #{ attr.template }="test.image">"""


      it 'remove the empty image css class when the image is set', ->
        imageUrl = 'http://www.bla.com'
        @view.wasAttachedToDom.fireWith(@view.$html)
        @component.set('image', imageUrl)
        @view.updateContent('image')

        expect(@view.$html).to.have.html """
          <img src="#{ imageUrl }"
            #{ test.imageAttr }="image"
            class="#{ css.component }"
            #{ attr.template }="test.image">"""


  describe 'of a component with a background image', ->

    beforeEach ->
      @component = test.getComponent('background-image')


    describe 'with the default image service', ->

      it 'sets the background-image in the style attribute', ->
        @component.set('image', 'http://images.com/1')
        @view = @component.createView()
        @view.updateContent('image')
        expect(@view.$html).to.have.html """
          <div
            style="background-image: url(http://images.com/1);"
            #{ test.imageAttr }="image"
            class="#{ css.component }"
            #{ attr.template }="test.background-image">"""


  describe 'ComponentView html', ->

    beforeEach ->
      @component = test.getComponent('html')
      @component.set('source', '<section>test</section>')
      @view = @component.createView()
      # There is additional code by the interaction blocker element in there
      # which is not nice but hopefully works out just fine.
      @expected = $ """
        <div class="#{ css.component }"
          #{ attr.template }="test.html"
          #{ test.htmlAttr }="source"
          style="position: relative; ">
          <section>test</section>
          <div class="doc-interaction-blocker" style="position: absolute; top: 0; bottom: 0; left: 0; right: 0;"></div>
        </div>
        """


    describe 'set("source", value)', ->

      it 'adds the html to the component', ->
        expect(@view.$html).to.have.html(@expected)


      describe 'when clearing an existing value', ->
        it 'inserts the default value', ->
          @component.set('source', undefined)
          @view.render()
          @expected.html(@component.template.defaults['source'])
          expect(@view.$html).to.have.html(@expected)


  describe 'using volatile values', ->

    beforeEach ->
      @component = test.getComponent('image')
      @component.directives.get('image').setBase64Image(base64Image)
      @view = @component.createView()


    it 'uses a temporary base64 value if there is no image set', ->
      @view.render()
      expect(@view.$html).to.have.attr('src', base64Image)


    it 'uses the image content if it is set after the temporary base64', ->
      @component.set('image', 'http://www.lolcats.com/images/u/12/24/lolcatsdotcompromdate.jpg')
      @view.render()
      expect(@view.$html).to.have.attr('src', 'http://www.lolcats.com/images/u/12/24/lolcatsdotcompromdate.jpg')


    it 'prefers a temporary value if it is set after the persisted url content', ->
      @component.set('image', 'http://www.lolcats.com/images/u/12/24/lolcatsdotcompromdate.jpg')
      @component.directives.get('image').setBase64Image(base64Image)
      @view.render()
      expect(@view.$html).to.have.attr('src', base64Image)


  describe 'with multiple components', ->

    beforeEach (done) ->
      { @renderer, @componentTree, @page } = test.get('page', 'renderer')
      @componentTree.fromData content: [
        component: 'title'
        content: { 'title': 'A Title' }
      ,
        component: 'subtitle'
        content: { 'title': 'A Subtitle' }
      ,
        component: 'container'
        containers:
          'children': [
            component: 'text'
            content: { 'text': 'some text' }
          ]
      ], undefined, false
      @componentTree.setMainView({ @renderer })
      @renderer.ready(done)


    describe 'next() and prev()', ->

      it 'return the correct views', ->
        titleView = @componentTree.find('title').first.getMainView()
        subtitleView = @componentTree.find('subtitle').first.getMainView()
        containerView = @componentTree.find('container').first.getMainView()

        expect(subtitleView.next()).to.equal(containerView)
        expect(subtitleView.prev()).to.equal(titleView)


    describe 'descendantsAndSelf()', ->

      it 'iterates over children', ->
        containerView = @componentTree.find('container').first.getMainView()
        textView = @componentTree.find('text').first.getMainView()
        views = []

        containerView.descendantsAndSelf (view) ->
          views.push(view)

        expect(views.length).to.equal(2)
        expect(views[0]).to.equal(containerView)
        expect(views[1]).to.equal(textView)


    describe 'refresh()', ->

      it 'recreates the html of the view (with descendants)', ->
        containerView = @componentTree.find('container').first.getMainView()
        containerView.$html.find('p').addClass('some-test')
        containerView.refresh()
        expect(containerView.$html[0].outerHTML).to.have.html '
          <div class="container">
            <div><p>some text</p></div>
          </div>
        '


      it 'updates the html of the renderer', ->
        containerView = @componentTree.find('container').first.getMainView()
        containerView.$html.find('p').addClass('some-test')
        containerView.refresh()
        expect(@page.renderNode).to.have.html '
          <section>
            <h1>A Title</h1>
            <h2>A Subtitle</h2>
            <div class="container">
              <div>
                <p>some text</p>
              </div>
            </div>
          </section>
        '

