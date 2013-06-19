describe 'Snippet Serialization', ->

  it 'saves one empty snippet', ->
    json = test.getSnippet('title').toJson()
    expect(json.identifier).toEqual('test.title')


  it 'saves the value of title snippet', ->
    value = 'This is it!'
    title = test.getSnippet('title')
    title.set('title', value)
    json = title.toJson()
    expect(json.editables['title']).toEqual(value)


describe 'SnippetTree Serialization', ->

  beforeEach ->
    @tree = new SnippetTree()


  it 'saves an empty SnippetTree', ->
    json = @tree.toJson()
    expect(json.content).toEqual([])


  it 'saves a snippet tree with one snippet', ->
    @tree.append( test.getSnippet('title') )
    json = @tree.toJson()
    expect(json.content[0].identifier).toEqual('test.title')


  it 'saves a snippet tree with nested snippets', ->
    row = test.getSnippet('row')
    row.append('main', test.getSnippet('title'))
    @tree.append(row)
    json = @tree.toJson()
    first = json.content[0]
    expect(first.identifier).toEqual('test.row')
    expect(first.containers['main'][0].identifier).toEqual('test.title')
    expect(first.containers['sidebar']).toEqual([])


describe 'Deserialization', ->

  beforeEach ->
    @design = test.getDesign()


  describe 'of a single snippet', ->

    beforeEach ->
      @json = test.localstore
        identifier: 'test.title'
        editables:
          'title': 'Baby Geniuses'


    it 'returns a snippet instance', ->
      snippet = Snippet.fromJson(@json, @design)
      expect(snippet instanceof Snippet).toEqual(true)
      expect(snippet.get('title')).toEqual('Baby Geniuses')


  describe 'of a snippet with children', ->

    beforeEach ->
      @rowJson = test.localstore
        identifier : 'test.row',
        containers : {
          main : [
            {
              identifier : 'test.title'
              editables : { 'title' : 'Do you feel lucky?' }
            },
            {
              identifier : 'test.text'
              editables : { 'text' : 'Well, do ya punk?' }
            },
          ]
          sidebar : []
        }


    it 'returns a snippet instance', ->
      row = Snippet.fromJson(@rowJson, @design)
      firstChild = row.containers['main'].first
      secondChild = firstChild.next
      expect(firstChild.get('title')).toEqual('Do you feel lucky?')
      expect(secondChild.get('text')).toEqual('Well, do ya punk?')


    it 'fits as content for a snippetTree', ->
      json = {
        content: [
          @rowJson
        ]
      }
      expect()
      tree = new SnippetTree(content: json, design: @design)
      expect(tree.root.first).toBeDefined()


    it 'igrnores null containers', ->
      @rowJson.containers.sidebar = null
      deserialize = =>
        snippet = Snippet.fromJson(@rowJson, @design)

      expect(deserialize).not.toThrow()


describe 'Serialize and Deserialize', ->

  beforeEach ->
    @design = test.getDesign()
    @before = new SnippetTree()
    row = test.getSnippet('row')
    title = test.getSnippet('title')
    title.set('title', 'What we have here is a failure to communicate')
    row.append('sidebar', title)
    @before.append(row)


  it 'deserializes the whole tree', ->
    json = test.localstore(@before.toJson())
    after = new SnippetTree(content: json, design: @design)
    title = after.find('title').first
    expect(title.get('title')).toEqual('What we have here is a failure to communicate')

