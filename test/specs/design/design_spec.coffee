Design = require('../../../src/design/design')
DesignStyle = require('../../../src/design/design_style')
Template = require('../../../src/template/template')

describe 'Design', ->

  describe 'with no params', ->

    beforeEach ->
      @design = new Design
        templates: []
        config: {}


    it 'adds a default namespace', ->
      expect(@design.namespace).to.equal('livingdocs-templates')


  describe 'with no templates', ->

    beforeEach ->
      @design = new Design
        templates: []
        config: { namespace: 'test' }


    it 'has a namespace', ->
      expect(@design.namespace).to.equal('test')


    it 'has the default paragraph element', ->
      expect(@design.paragraphSnippet).to.equal('text')


  describe 'with a template and paragraph element', ->

    beforeEach ->
      @design = new Design
        templates: test.testDesign.templates
        config: { namespace: 'test', paragraph: 'p' }


    it 'stores the template as Template', ->
      expect(@design.templates[0]).to.be.an.instanceof(Template)


    it 'has a paragraph element', ->
      expect(@design.paragraphSnippet).to.equal('p')


    describe 'get()', ->

      it 'gets the template by identifier', ->
        title = @design.get('test.title')
        expect(title).to.be.an.instanceof(Template)
        expect(title.identifier).to.equal('test.title')


      it 'gets the template by name', ->
        title = @design.get('title')
        expect(title).to.be.an.instanceof(Template)
        expect(title.identifier).to.equal('test.title')


      it 'returns undefined for a non-existing template', ->
        expect( @design.get('something-ludicrous') ).to.equal(undefined)


    describe 'remove()', ->

      it 'removes the template', ->
        @design.remove('title')
        expect( @design.get('title') ).to.be.undefined


  describe 'groups', ->

    beforeEach ->
      @design = new Design(test.testDesign)


    it 'are available through #groups', ->
      groups = Object.keys @design.groups
      expect(groups).to.contain('layout')
      expect(groups).to.contain('header')
      expect(groups).to.contain('other')


    it 'contain templates', ->
      container = @design.get('container')
      expect(@design.groups['layout'].templates['container']).to.equal(container)


  describe 'styles configuration', ->

    beforeEach ->
      @design = new Design(test.testDesign)


    it 'has global style Color', ->
      expect(@design.globalStyles['Color']).to.be.an.instanceof(DesignStyle)


    it 'merges global, group and template styles', ->
      template = @design.get('hero')
      templateStyles = Object.keys template.styles
      expect(templateStyles).to.contain('Color') # global style
      expect(templateStyles).to.contain('Capitalized') # group style
      expect(templateStyles).to.contain('Extra Space') # template style


    it 'assigns global styles to a template with no other styles', ->
      template = @design.get('container')
      templateStyles = Object.keys template.styles
      expect(templateStyles).to.contain('Color') # global style
      expect(templateStyles).not.to.contain('Capitalized') # group style
      expect(templateStyles).not.to.contain('Extra Space') # template style


