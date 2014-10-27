designParser = require('../../../src/design/design_parser')
Design = require('../../../src/design/new_design')
Template = require('../../../src/template/template')
CssModificatorProperty = require('../../../src/design/css_modificator_property')

describe 'designParser', ->

  describe 'simple design', ->

    # Use a before to only construct the design one.
    # Here we just use multiple specs to test all aspects of the returned design
    before ->
      designConfig =

        design:
          name: 'test'
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

      @design = designParser.parse(designConfig)


    it 'returns an instance of Design', ->
      expect(@design).to.be.an.instanceof(Design)


    it 'sets the designs name and version', ->
      expect(@design.name).to.equal('test')
      expect(@design.version).to.equal('1.0.0')


    it 'parses the components', ->
      expect(@design.get('title')).to.be.an.instanceof(Template)


    it 'parses the componentProperties', ->
      title = @design.get('title')
      expect(title.styles['position']).to.be.an.instanceof(CssModificatorProperty)


