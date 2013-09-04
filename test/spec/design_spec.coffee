describe 'Design', ->

  describe 'with no params', ->

    beforeEach ->
      @design = new Design
        templates: []
        config: {}


    it 'adds a default namespace', ->
      expect(@design.namespace).toEqual('livingdocs-templates')


  describe 'with no templates', ->

    beforeEach ->
      @design = new Design
        templates: []
        config: { namespace: 'test' }


    it 'has a namespace', ->
      expect(@design.namespace).toEqual('test')


  describe 'with a template', ->

    beforeEach ->
      @design = new Design
        templates: testDesign.templates
        config: { namespace: 'test' }


    it 'stores the template as Template', ->
      expect(@design.templates[0] instanceof Template).toBe(true)


    describe 'get()', ->

      it 'gets the template by identifier', ->
        title = @design.get('test.title')
        expect(title instanceof Template).toBe(true)
        expect(title.identifier).toEqual('test.title')


      it 'gets the template by name', ->
        title = @design.get('title')
        expect(title instanceof Template).toBe(true)
        expect(title.identifier).toEqual('test.title')


      it 'returns undefined for a non-existing template', ->
        expect( @design.get('something-ludicrous') ).toEqual(undefined)


    describe 'remove()', ->

      it 'removes the template', ->
        @design.remove('title')
        expect( @design.get('title') ).not.toBeDefined()


  describe 'groups', ->

    beforeEach ->
      @design = new Design(testDesign)


    it 'are available through #groups', ->
      groups = Object.keys @design.groups
      expect(groups).toContain('layout')
      expect(groups).toContain('header')
      expect(groups).toContain('other')


    it 'contain templates', ->
      container = @design.get('container')
      expect(@design.groups['layout'].templates['container']).toBe(container)


  describe 'styles configuration', ->

    beforeEach ->
      @design = new Design(testDesign)


    it 'has global style Color', ->
      expect(@design.globalStyles['Color'] instanceof DesignStyle).toBe(true)


    it 'merges global, group and template styles', ->
      template = @design.get('hero')
      templateStyles = Object.keys template.styles
      expect(templateStyles).toContain('Color') # global style
      expect(templateStyles).toContain('Capitalized') # group style
      expect(templateStyles).toContain('Extra Space') # template style


    it 'assigns global styles to a template with no other styles', ->
      template = @design.get('container')
      templateStyles = Object.keys template.styles
      expect(templateStyles).toContain('Color') # global style
      expect(templateStyles).not.toContain('Capitalized') # group style
      expect(templateStyles).not.toContain('Extra Space') # template style


