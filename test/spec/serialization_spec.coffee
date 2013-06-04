describe 'Serialization', ->

  beforeEach ->
    @tree = new SnippetTree()


  it 'saves an empty SnippetTree', ->
    json = @tree.toJson()
    expect(json.root).toEqual([])


  it 'saves one snippet', ->
    json = test.getSnippet('title').toJson()
    expect(json.identifier).toEqual('test.title')


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
