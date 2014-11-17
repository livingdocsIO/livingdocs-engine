Design = require('../../../src/design/design')
CssModificatorProperty = require('../../../src/design/css_modificator_property')
Template = require('../../../src/template/template')
editableAttr = test.config.directives.editable.attr

describe 'Design', ->

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

