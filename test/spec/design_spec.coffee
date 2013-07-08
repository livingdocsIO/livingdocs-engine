describe 'Design', ->

  beforeEach ->
    options = { namespace: 'test' }
    @design = new Design(options)


  it 'has a namespace', ->
    expect(@design.namespace).toEqual('test')


  it 'adds a default namespace', ->
    expect( (new Design({})).namespace ).toEqual('livingdocs-templates')


  describe 'with a template', ->

    beforeEach ->
      templateConfig = testSnippets.snippets['title']
      @design.add('title', templateConfig)


    it 'stores the template as Template', ->
      expect(@design.templates['title'] instanceof Template).toEqual(true)


    describe 'get()', ->

      it 'gets the template by identifier', ->
        template = @design.templates['title']
        expect(@design.get('test.title')).toEqual(template)


      it 'gets the template by name', ->
        template = @design.templates['title']
        expect(@design.get('title')).toEqual(template)


      it 'returns undefined for a non-existing template', ->
        expect( @design.get('something-ludicrous') ).toEqual(undefined)


    describe 'remove()', ->

      it 'removes the template', ->
        @design.remove('title')
        expect( @design.get('title') ).not.toBeDefined()
