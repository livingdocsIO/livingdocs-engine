designParser = require('../../../src/design/design_parser')
Design = require('../../../src/design/design')
Template = require('../../../src/template/template')
CssModificatorProperty = require('../../../src/design/css_modificator_property')

describe 'design_parser:', ->

  describe 'minimal design', ->

    before ->
      @design = designParser.parse
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
        name: 'complete'
        version: 'v1.0.0-eternal-bliss'
        author: 'Peter Pan'

        assets:
          css: ["/stylesheets/test.css"]

        componentProperties:
          'position':
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
        ,
          name: 'image'
          label: 'Image'
          directives:
            image:
              imageRatios: ["16:9"]
          html: '<img doc-image="image">'
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

        metadataConfig:
          "title":
            matches: ["hero.title", "title.title"]
          "description":
            matches: ["title.title"]

        imageRatios:
          "16:9":
            label: "16:9 Cinemascope"
            ratio: "16/9"


    it 'returns an instance of Design', ->
      expect(@design).to.be.an.instanceof(Design)


    it 'sets the designs name and version', ->
      expect(@design.name).to.equal('complete')
      expect(@design.version).to.equal('1.0.0-eternal-bliss')


    it 'parses the assets', ->
      expect(@design.dependencies.hasCss()).to.equal(true)
      dependency = @design.dependencies.css[0]
      expect(dependency.src).to.equal('/stylesheets/test.css')


    it 'parses the components', ->
      expect(@design.get('title')).to.be.an.instanceof(Template)


    it 'sets a component label', ->
      expect(@design.get('paragraph').label).to.equal('Text')


    it 'parses the componentProperties', ->
      title = @design.get('title')
      expect(title.styles['position']).to.be.an.instanceof(CssModificatorProperty)


    it 'sets the metadataConfig', ->
      config = @design.metadataConfig
      expect(config.title.matches.length).to.equal(2)
      expect(config.description.matches.length).to.equal(1)


    it 'parses the imageRatios', ->
      ratio = @design.imageRatios["16:9"]
      expect(ratio.name).to.equal('16:9')
      expect(ratio.label).to.equal('16:9 Cinemascope')
      expect(ratio.ratio).to.be.closeTo(1.77, .01)


    it 'assigns the ratios to the right directive', ->
      image = @design.get('image')
      imageDirective = image.directives.get('image')
      ratio = imageDirective.config.imageRatios[0]
      expect(ratio.name).to.equal('16:9')
      expect(ratio.label).to.equal('16:9 Cinemascope')
      expect(ratio.ratio).to.be.closeTo(1.77, .01)


    it 'parses componentProperty labels', ->
      title = @design.get('title')
      expect(title.styles['extra-space'].label).to.equal('Extra Space')


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
        name: 'minimal'
        version: '0.0.1'
        components: [
          name: 'title'
        ]

      expect( -> designParser.parse(json) )
        .to.throw('design.components[0].html: required property missing')


    it 'returns a parse error for a wrongly linked default paragraph', ->
      json =
        name: 'minimal'
        version: '0.0.1'
        components: [
          name: 'title'
          html: '<h1 doc-editable="title"></h1>'
        ]
        defaultComponents:
          paragraph: 'title-xxx'

      expect( -> designParser.parse(json) )
        .to.throw('Error creating the design: Could not find component title-xxx')

