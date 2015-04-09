_ = require('underscore')
Design = require('../../../src/design/design')
CssModificatorProperty = require('../../../src/design/css_modificator_property')
Template = require('../../../src/template/template')
editableAttr = test.config.directives.editable.attr

describe 'design:', ->

  describe 'with no params', ->

    it 'throws an error', ->
      test = -> new Design()
      expect(test).to.throw()


  describe 'with just a name', ->

    beforeEach ->
      @design = new Design(name: 'test')


    it 'has a name', ->
      expect(@design.name).to.equal('test')


    it 'has an identifier', ->
      expect(@design.identifier).to.equal('test')


    describe 'equals()', ->

      it 'recognizes the same design as equal', ->
        sameDesign = new Design(name: 'test')
        expect(@design.equals(sameDesign)).to.equal(true)


      it 'recognizes a different design', ->
        otherDesign = new Design(name: 'other')
        expect(@design.equals(otherDesign)).to.equal(false)


      it 'recognizes different versions', ->
        differentVersion = new Design(name: 'test', version: '1.0.0')
        expect(@design.equals(differentVersion)).to.equal(false)


  describe 'with a name and a version', ->

    beforeEach ->
      @design = new Design(name: 'test', version: '1.0.0')


    it 'has an identifier', ->
      expect(@design.identifier).to.equal('test@1.0.0')


  describe 'with a template and paragraph element', ->

    beforeEach ->
      @design = new Design(name: 'test')

      @design.add new Template
        name: 'title'
        html: """<h1 #{ editableAttr }="title"></h1>"""

      @design.add new Template
        name: 'text'
        html: """<p #{ editableAttr }="text"></p>"""


    it 'stores the template as Template', ->
      expect(@design.components[0]).to.be.an.instanceof(Template)


    describe 'get()', ->

      it 'gets the template by name', ->
        title = @design.get('title')
        expect(title).to.be.an.instanceof(Template)
        expect(title.name).to.equal('title')


      it 'returns undefined for a non-existing template', ->
        expect( @design.get('something-ludicrous') ).to.equal(undefined)


  describe 'groups', ->

    beforeEach ->
      @design = test.getDesign()


    it 'are available through #groups', ->
      groups = @design.groups
      expect(@design.groups[0]).to.have.property('label', 'Layout')


  describe 'componentProperties', ->

    beforeEach ->
      @design = test.getDesign()


    it 'hero component has properties "extra-space" and "capitalized"', ->
      hero = @design.get('hero')
      expect(hero.styles).to.have.keys('capitalized', 'extra-space', 'color')


  describe 'default components', ->

    beforeEach ->
      @design = test.getDesign()

    it 'gets the default paragraph component name', ->
      expect(@design.getDefaultParagraphComponentName()).to.equal('text')


    it 'gets the default image component name', ->
      expect(@design.getDefaultImageComponentName()).to.equal('image')


    it 'get the default image directive name', ->
      expect(@design.getDefaultImageDirectiveName()).to.equal('image')


  describe 'test design', ->

    expectToContain = (array, searched) ->
      first = _.find array, (obj) ->
        _.isEqual(obj, searched)

      expect(first).to.exist


    beforeEach ->
      @design = test.getDesign()


    describe 'getTransformOptions()', ->

      it 'returns hero as fully-compatible templates for title', ->
        options = @design.getTransformOptions
          template: @design.get('title')

        expect(options).to.deep.include.members [
          name: 'subtitle'
          isCompatible: true
          mapping:
            'title': 'title'
        ]


      it 'returns all fully-compatible templates for title', ->
        options = @design.getTransformOptions
          template: @design.get('title')

        componentNames = _.map(options, (item) -> item.name)
        expect(componentNames).to.have.members [
          'subtitle', 'text', 'listItem'
        ]


      it 'does not return itself', ->
        options = @design.getTransformOptions
          template: @design.get('title')

        componentNames = _.map(options, (item) -> item.name)
        expect(componentNames).not.to.include('title')


      it 'returns all one way compatible templates for title', ->
        options = @design.getTransformOptions
          template: @design.get('title')
          oneWay: true

        componentNames = _.map(options, (item) -> item.name)
        expect(componentNames).to.have.members [
          'hero', 'subtitle', 'text', 'cover', 'button',
          'related-article', 'listItem', 'compositeHtml'
        ]


      it 'returns all compatible templates for cover directive image', ->
        options = @design.getTransformOptions
          template: @design.get('cover')
          directives: ['image']

        componentNames = _.map(options, (item) -> item.name)
        expect(componentNames).to.have.members ['image', 'background-image']

