_ = require('underscore')
base64Image = require('../../support/test_base64_image')
config = test.config
ComponentContainer = require('../../../src/component_tree/component_container')
LinkDirective = require('../../../src/component_tree/link_directive')

describe 'component_model:', ->

  describe 'Title Component', ->

    beforeEach ->
      @title = test.getComponent('title')


    it 'instantiates from template', ->
      expect(@title).to.exist


    it 'has a componentName', ->
      expect(@title.componentName).to.equal('title')


    it 'has an id', ->
      expect(@title.id).to.exist
      expect(@title.id).to.be.a('string')
      expect(@title.id).to.have.length.above(10)


    it 'has no containers', ->
      expect(@title.containers).not.to.exist


    it 'hasContainers() returns false', ->
      expect(@title.hasContainers()).to.equal(false)


    it 'has no next or previous', ->
      expect(@title.next).not.to.exist
      expect(@title.previous).not.to.exist


    it 'has one editable named "title"', ->
      expect(@title.content).to.have.size(1)
      expect(@title.content).to.have.ownProperty('title')


    it 'title editable has no value at the beginning', ->
      expect(@title.content['title']).not.to.exist


    describe 'set()', ->

      it 'sets editable content', ->
        caption = 'Talk to the hand'
        @title.set('title', caption)
        expect(@title.get('title')).to.equal(caption)


  describe 'getTransformOptions()', ->

    it 'gets the transform options', ->
      @title = test.getComponent('title')
      options = @title.getTransformOptions()
      expect(options).to.have.deep.members [
        componentName: 'subtitle'
        label: 'Subtitle with a default value'
      ,
        componentName: 'text'
        label: 'Paragraph'
      ,
        componentName: 'listItem'
        label: 'Component that can only be placed in a restricted container'
      ]




    # listItems can only be inserted into lists. So they
    # are not an option at the root level of a componentTree.
    it 'Does not include forbidden element listItem', ->
      componentTree = test.createComponentTree [{ title: undefined } ]
      title = componentTree.first()
      options = title.getTransformOptions()
      componentNames = _.map(options, (item) -> item.componentName)
      expect(componentNames).to.have.members(['subtitle', 'text'])


  describe 'transform()', ->

    it 'transforms a paragraph into a title component', ->
      componentTree = test.createComponentTree [{ text: undefined } ]
      text = componentTree.first()
      text.set('text', 'Moby Dick')
      text.transform('title')
      title = componentTree.first()
      expect(componentTree.serialize().content.length).to.equal(1)
      expect(title.componentName).to.equal('title')
      expect( title.get('title') ).to.equal('Moby Dick')


    it 'returns an instance of the new model', ->
      componentTree = test.createComponentTree [{ text: undefined } ]
      text = componentTree.first()
      title = text.transform('title')
      expect(title.componentName).to.equal('title')


  describe 'Row Component', ->

    beforeEach ->
      @row = test.getComponent('row')


    it 'has a componentName', ->
      expect(@row.componentName).to.equal('row')


    it 'has no editables or images', ->
      expect(@row.content).not.to.exist


    it 'initializes the two containers', ->
      expect(@row.containers.main).to.be.an.instanceof(ComponentContainer)
      expect(@row.containers.sidebar).to.be.an.instanceof(ComponentContainer)


    it 'hasContainers()', ->
      expect(@row.hasContainers()).to.equal(true)


    it 'does not create directives for the containers ', ->
      expect(@row.directives.length).to.equal(0)


  describe 'Container Component', ->

    beforeEach ->
      @container = test.getComponent('container')


    it 'has named its container to "children"', ->
      expect(@container.containers['children']).to.exist


  # Component with a container with a config
  describe 'List Component', ->

    beforeEach ->
      @container = test.getComponent('list')


    it 'has a restriction configuration', ->
      container = @container.containers['children']
      expect(container.allowedChildren).to.have.keys('listItem', 'text')


    describe 'containers[\'children\'].isAllowedAsChild()', ->

      it 'accepts a text component', ->
        text = test.getComponent('text')
        children = @container.containers['children']
        expect(children.isAllowedAsChild(text)).to.equal(true)


      it 'does not accept a row component', ->
        row = test.getComponent('row')
        children = @container.containers['children']
        expect(children.isAllowedAsChild(row)).to.equal(false)


  describe 'Image component', ->

    beforeEach ->
      @image = test.getComponent('image')


    it 'has one image', ->
      expect(@image.content).to.have.ownProperty('image')


    it 'sets a base64 image', ->
      @image.directives.get('image').setBase64Image(base64Image)
      expect(@image.directives.get('image').base64Image).to.equal(base64Image)
      expect(@image.get('image')).to.equal(undefined)


    it 'resets a base64 image when the url is set', ->
      @image.directives.get('image').setBase64Image(base64Image)
      @image.set('image', 'http://www.lolcats.com/images/u/12/24/lolcatsdotcompromdate.jpg')
      expect(@image.directives.get('image').base64Image).to.be.undefined
      expect(@image.get('image')).to.equal('http://www.lolcats.com/images/u/12/24/lolcatsdotcompromdate.jpg')


  describe 'Hero ComponentModel#style', ->

    beforeEach ->
      @hero = test.getComponent('hero')


    it 'gets style "extra-space"', ->
      expect(@hero.getStyle('extra-space')).to.be.undefined


    it 'sets style "extra-space"', ->
      @hero.setStyle('extra-space', 'extra-space')
      expect(@hero.styles['extra-space']).to.equal('extra-space')


    it 'resets style "extra-space" with "" (empty string)', ->
      @hero.setStyle('extra-space', 'extra-space')
      @hero.setStyle('extra-space', '')
      expect(@hero.styles['extra-space']).to.equal('')


    it 'resets style "extra-space" with null', ->
      @hero.setStyle('extra-space', 'extra-space')
      @hero.setStyle('extra-space', null)
      expect(@hero.styles['extra-space']).to.be.null

    it 'sets style "color"', ->
      @hero.setStyle('color', 'color--blue')
      expect(@hero.styles['color']).to.equal('color--blue')


    it 'gets previously set style "extra-space', ->
      @hero.setStyle('extra-space', 'extra-space')
      expect(@hero.styles['extra-space']).to.equal('extra-space')


    it 'does not set style "extra-space" with unknown class', ->
      @hero.setStyle('extra-space', 'are-you-kidding-me')
      expect(@hero.styles['extra-space']).to.be.undefined


    it 'does not set unspecified style "conundrum"', ->
      @hero.setStyle('conundrum', 'wtf')
      expect(@hero.styles['conundrum']).to.be.undefined


  describe 'Html component', ->

    beforeEach ->
      @html = test.getComponent('html')


    it 'has one html field', ->
      expect(@html.content).to.have.ownProperty('source')


    describe 'with content', ->

      beforeEach ->
        @html.set('source', '<section>text</section>')


      it 'has the html field set in content', ->
        expect(@html.content['source']).to.equal('<section>text</section>')


      it 'can get the content', ->
        expect(@html.get('source')).to.equal('<section>text</section>')


  describe 'Button component', ->

    beforeEach ->
      @component = test.getComponent('button')
      @component.set('link', 'http://upfront.io/')
      @component.set('text', 'Who is upfront?')


    it 'hasLinks()', ->
      expect(@component.hasLinks()).to.equal(true)


    it 'has two directives()', ->
      expect(@component.directives.length).to.equal(2)
      expect(@component.directives.get('link')).not.to.be.undefined
      expect(@component.directives.get('text')).not.to.be.undefined


    it 'has set the directive content', ->
      expect(@component.get('link')).to.equal('http://upfront.io/')
      expect(@component.get('text')).to.equal('Who is upfront?')



  describe 'Related Article component', ->

    beforeEach ->
      @component = test.getComponent('related-article')
      @component.set('article-link', 'http://upfront.io/')


    it 'has a link directive', ->
      expect(@component.directives[0]).to.be.an.instanceof(LinkDirective)


    it 'has the related-articel field set in content', ->
      expect(@component.get('article-link')).to.equal('http://upfront.io/')
