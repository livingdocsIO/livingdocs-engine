describe 'Snippet Serialization', ->

  it 'saves one empty snippet', ->
    json = test.getSnippet('title').toJson()
    expect(json.identifier).toEqual('test.title')


  it 'saves the value of title snippet', ->
    value = 'This is it!'
    title = test.getSnippet('title')
    title.set('title', value)
    json = title.toJson()
    expect(json.fields['title']).toEqual(value)


describe 'SnippetTree Serialization', ->

  beforeEach ->
    @tree = new SnippetTree()


  it 'saves an empty SnippetTree', ->
    json = @tree.toJson()
    expect(json.root).toEqual([])


  it 'saves a snippet tree with one snippet', ->
    @tree.append( test.getSnippet('title') )
    json = @tree.toJson()
    expect(json.root[0].identifier).toEqual('test.title')


  it 'saves a snippet tree with nested snippets', ->
    row = test.getSnippet('row')
    row.append('main', test.getSnippet('title'))
    @tree.append(row)
    json = @tree.toJson()
    first = json.root[0]
    expect(first.identifier).toEqual('test.row')
    expect(first.containers['main'][0].identifier).toEqual('test.title')
    expect(first.containers['sidebar']).toEqual([])


describe 'Deserialization', ->

  describe 'of a single snippet', ->

    beforeEach ->
      @design = test.getDesign()
      @json =
        root: [
          identifier: 'test.title'
          fields:
            'title': 'Baby Geniuses'
        ]

    it 'returns a snippet instance', ->
      snippet = Snippet.fromJson(@json.root[0], @design)
      expect(snippet instanceof Snippet).toEqual(true)
      expect(snippet.get('title')).toEqual('Baby Geniuses')


  # describe 'of a snippet tree', ->

  #   beforeEach ->
    # @json =
    #   root : [
    #     {
    #       identifier : 'test.row',
    #       fields : undefined
    #       containers : {
    #         main : [
    #           {
    #             identifier : 'test.title'
    #             fields : { title : undefined }, level : 1
    #           }
    #         ]
    #         sidebar : [  ]
    #       },
    #       level : 0
    #     }
    #   ]
