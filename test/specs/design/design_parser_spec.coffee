designParser = require('../../../src/design/design_parser')
Design = require('../../../src/design/design')
Template = require('../../../src/template/template')
CssModificatorProperty = require('../../../src/design/css_modificator_property')

describe 'designParser', ->

  describe 'minimal design', ->

    before ->
      @design = designParser.parse
        design:
          name: 'minimal'
          version: '0.0.1'
        components: [
          name: 'title'
          html: '<h1 doc-editable="title"></h1>'
        ]

    it 'returns an instance of Design', ->
      expect(@design).to.be.an.instanceof(Design)


    it 'parses the title component', ->
      expect(@design.get('title')).to.be.an.instanceof(Template)


  describe 'complete design', ->

    # Use a before to only construct the design one.
    # Here we just use multiple specs to test all aspects of the returned design
    before ->
      @design = designParser.parse

        design:
          name: 'complete'
          version: '1.0.0'
          author: 'Peter Pan'

        assets:
          css: ["/stylesheets/test.css"]

        componentProperties:
          'position':
            name: 'position'
            label: 'Position'
            type: 'select'
            options: [
              caption: 'Default'
            ,
              caption: 'Left'
              value: 'position-left'
            ,
              caption: 'Right'
              value: 'position-right'
            ]
          'extra-space':
            name: 'extra-space'
            label: 'Extra Space'
            type: 'option'
            value: 'extra-space'

        components: [
          name: 'title'
          html: '<h1 doc-editable="title"></h1>'
          properties: ['position', 'extra-space']
        ,
          name: 'paragraph'
          label: 'Text'
          html: '<p doc-editable="title"></p>'
        ]

        groups: [
          label: 'Headers'
          components: ['title']
        ,
          label: 'Text'
          components: ['paragraph']
        ]

        defaultComponents:
          paragraph: 'paragraph'


    it 'returns an instance of Design', ->
      expect(@design).to.be.an.instanceof(Design)


    it 'sets the designs name and version', ->
      expect(@design.name).to.equal('complete')
      expect(@design.version).to.equal('1.0.0')


    it 'parses the assets', ->
      expect(@design.assets.hasCss()).to.equal(true)
      expect(@design.assets.css[0]).to.equal('/stylesheets/test.css')


    it 'parses the components', ->
      expect(@design.get('title')).to.be.an.instanceof(Template)


    it 'sets a component label', ->
      expect(@design.get('paragraph').label).to.equal('Text')


    it 'parses the componentProperties', ->
      title = @design.get('title')
      expect(title.styles['position']).to.be.an.instanceof(CssModificatorProperty)


    it 'parses the groups', ->
      expect(@design.groups.length).to.equal(2)


    it 'looks up the components for groups', ->
      headerGroup = @design.groups[0]
      expect(headerGroup.components[0]).to.be.an.instanceof(Template)
      expect(headerGroup.components[0].name).to.equal('title')


    it 'sets the default text paragraph', ->
      expect(@design.defaultParagraph.name).to.equal('paragraph')


  describe 'parse error', ->

    it 'returns a parse error for an invalid component', ->
      json =
        design:
          name: 'minimal'
          version: '0.0.1'
        components: [
          name: 'title'
        ]

      expect( -> designParser.parse(json) )
        .to.throw('design.components[0].html: required property missing')


    it 'returns a parse error for a wrongly linked default paragraph', ->
      json =
        design:
          name: 'minimal'
          version: '0.0.1'
        components: [
          name: 'title'
          html: '<h1 doc-editable="title"></h1>'
        ]
        defaultComponents:
          paragraph: 'title-xxx'

      expect( -> designParser.parse(json) )
        .to.throw('Error creating the design: Error: Could not find component title-xxx')

