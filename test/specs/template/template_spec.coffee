Template = require('../../../src/template/template')
ComponentModel = require('../../../src/component_tree/component_model')
ComponentView = require('../../../src/rendering/component_view')
css = test.config.css

describe 'template:', ->

  describe 'Title Template', ->

    beforeEach ->
      @template = new Template
        name: 'h1'
        html: """<h1 #{ test.editableAttr }="title"></h1>"""


    it 'has $template Property', ->
      expect(@template.$template).to.exist


    it 'has a name', ->
      expect(@template.name).to.equal('h1')


    it 'has one directive', ->
      expect(@template.directives.length).to.equal(1)


    it 'has stored the html', ->
      expect(@template.$template).to.have.same.html """
        <h1 #{ test.editableAttr }='title' class='#{ css.editable }'>
        </h1>"""


    describe '#createModel()', ->

      it 'returns a ComponentModel', ->
        model = @template.createModel()
        expect(model instanceof ComponentModel).to.equal(true)


    describe '#createView()', ->

      it 'returns a ComponentView instance', ->
        componentView = @template.createView()
        expect(componentView instanceof ComponentView).to.equal(true)


    describe 'isCompatible()', ->

      it 'is compatible with a subtitle', ->
        other = test.getTemplate('subtitle')
        compatibility = @template.isCompatible(other)
        expect(compatibility).to.deep.equal
          allCompatible: true
          mapping:
            'title': 'title'


      it 'is not compatible with a an image', ->
        other = test.getTemplate('image')
        compatibility = @template.isCompatible(other)
        expect(compatibility).to.deep.equal
          allCompatible: false
          mapping:
            'title': null


  describe 'doc-link directive', ->
    it 'is parsed', ->
      template = new Template
        name: 'external-link-component'
        html: """<a #{ test.linkAttr }="a-link-directive"></a>"""

      expect(template.directives.length).to.equal(1)
      expect(template.directives[0].type).to.equal('link')


  describe 'Template.parseIdentifier()', ->

    it 'parses "bootstrap.title"', ->
      identifier = Template.parseIdentifier('bootstrap.title')
      expect(identifier.designName).to.equal('bootstrap')
      expect(identifier.name).to.equal('title')


    it 'does not parse "bootstrap"', ->
      identifier = Template.parseIdentifier('title')
      expect(identifier.designName).to.be.undefined
      expect(identifier.name).to.equal('title')


    it 'does not parse emtpy string', ->
      identifier = Template.parseIdentifier('')
      expect(identifier).to.be.undefined


    it 'does not parse undefined', ->
      identifier = Template.parseIdentifier()
      expect(identifier).to.be.undefined


  describe 'Template with default value', ->

    it 'trims the default value', ->
      template = new Template
        name: 'title'
        html: """<h1 #{ test.editableAttr }="title">\n\t your title\t </h1>"""

      expect(template.defaults['title']).to.equal('your title')


  # Component with containers
  describe 'Row Template', ->

    beforeEach ->
      @template = test.getTemplate('row')


    it 'has tow container directives', ->
      mainDirective = @template.directives.get('main')
      sidebarDirective = @template.directives.get('sidebar')
      expect(mainDirective.type).to.equal('container')
      expect(sidebarDirective.type).to.equal('container')


    it 'creates a componentModel successfully', ->
      component = @template.createModel()
      expect(component).to.exist


  describe 'Subtitle Template', ->

    it 'has a default value', ->
      subtitle = test.getTemplate('subtitle')
      expect(subtitle.defaults['title']).to.equal('Who\'s your Caddy?')


    it 'removes the default value from the template', ->
      subtitle = test.getTemplate('subtitle')
      expect(subtitle.$template[0].innerHTML).to.equal('')


    it 'prints the info', ->
      subtitle = test.getTemplate('subtitle')
      expect(subtitle.info()).to.deep.equal
        name: 'subtitle'
        design: 'test'
        directives: [
          name: 'title'
          type: 'editable'
        ]
        properties: [
          name: 'color'
          type: 'cssModificator'
        ]


  describe 'Container', ->

   it 'creates a "children" directive', ->
      container = test.getTemplate('container')
      expect(container.directives.all.hasOwnProperty('children')).to.equal(true)


  describe 'Stuffed Container', ->

    it 'removes container content from $template', ->
      stuffedContainer = test.getTemplate('stuffedContainer')
      $container = stuffedContainer.$template.find('.container')
      expect($container.length).to.equal(1)
      expect($container.html()).to.equal('')


  describe 'Html Template', ->

    beforeEach ->
      @template = test.getTemplate('html')


    it 'has a html directive', ->
      directive = @template.directives.html[0]
      expect(directive).to.exist


  describe 'listItem Template', ->

    beforeEach ->
      @template = test.getTemplate('listItem')


    it 'has an allowedParents configuration', ->
      expect(@template.allowedParents).to.have.members(['list'])

