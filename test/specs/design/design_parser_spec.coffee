designParser = require('../../../src/design/design_parser')

describe 'designParser', ->

  describe 'simple design', ->

    it 'parses a standard design', ->
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

      design = designParser.parse(designConfig)
      expect(design).not.to.equal(false)
      expect(design.name).to.equal('test')
      expect(design.version).to.equal('1.0.0')
