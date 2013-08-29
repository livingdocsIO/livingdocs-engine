describe 'Design', ->

  beforeEach ->
    @design = new Design
      templates: []
      config: { namespace: 'test' }

  it 'has a namespace', ->
    expect(@design.namespace).toEqual('test')


  it 'adds a default namespace', ->
    design =
      templates: {}
      config: {}
    expect( (new Design(design)).namespace ).toEqual('livingdocs-templates')


  describe 'with a template', ->

    beforeEach ->
      for i, template of testDesign.templates
        @design.add(template)


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


    describe 'group configuration', ->

      beforeEach ->
        @design = new Design(testDesign)


      it 'is available in design', ->
        groups = Object.keys @design.groups
        expect(groups).toContain('layout')
        expect(groups).toContain('header')
        expect(groups).toContain('other')


      it 'design contains templates', ->
        container = @design.get('container')
        expect(@design.groups['layout'].templates['container']).toBe(container)
