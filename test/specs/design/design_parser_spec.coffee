designParser = require('../../../src/design/design_parser')
Design = require('../../../src/design/new_design')
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
          id: 'title'
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
            name: 'Position'
            type: 'select'
            options: [
              caption: 'Left'
              value: 'position-left'
            ,
              caption: 'Right'
              value: 'position-right'
            ]
          'extra-space':
            name: 'Extra Space'
            type: 'option'
            value: 'extra-space'

        components: [
          id: 'title'
          html: '<h1 doc-editable="title"></h1>'
          properties: ['position', 'extra-space']
        ,
          id: 'paragraph'
          html: '<p doc-editable="title"></p>'
        ]

        groups: [
          name: 'Headers'
          components: ['title']
        ,
          name: 'Text'
          components: ['paragraph']
        ]


    it 'returns an instance of Design', ->
      expect(@design).to.be.an.instanceof(Design)


    it 'sets the designs name and version', ->
      expect(@design.name).to.equal('complete')
      expect(@design.version).to.equal('1.0.0')


    it 'parses the components', ->
      expect(@design.get('title')).to.be.an.instanceof(Template)


    it 'parses the componentProperties', ->
      title = @design.get('title')
      expect(title.styles['position']).to.be.an.instanceof(CssModificatorProperty)


  describe 'parse error', ->

    before ->
      @design = designParser.parse
        design:
          name: 'minimal'
          version: '0.0.1'
        components: [
          id: 'title'
        ]

    it 'returns a parse error', ->
      expect(@design).to.equal(false)
      expect(designParser.errors[0]).to.equal('design.components[0].html: required property missing')
