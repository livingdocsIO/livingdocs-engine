describe 'Snippet Serialization', ->

  describe 'empty snippet', ->

    it 'gets saved', ->
      json = test.getSnippet('title').toJson()
      expect(json.identifier).toEqual('test.title')


  describe 'title snippet', ->

    it 'saves the titles value', ->
      expectedValue = 'This is it!'
      title = test.getSnippet('title')
      title.set('title', expectedValue)
      json = title.toJson()
      expect(json.editables['title']).toEqual(expectedValue)


  describe 'of styles', ->

    it 'saves all styles', ->
      expectedValue =
        'Extra Space': 'extra-space'
        'Color': 'color--blue'

      hero = test.getSnippet('hero')
      hero.style('Extra Space', 'extra-space')
      hero.style('Color', 'color--blue')
      json = hero.toJson()
      expect(json.styles).toEqual(expectedValue)



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


  describe 'of an in-exstistant snippet', ->

    it 'throws an error', ->
      json = { identifier: 'unknown-snippet' }

      deserialize = =>
        snippet = SnippetModel.fromJson(json, @design)

      expect(deserialize).toThrow()


  describe 'of an invalid editable name', ->

    it 'throws an error', ->
      json =
        identifier: 'test.title'
        editables:
          'title-misspelled': 'Baby Geniusses'

      deserialize = =>
        snippet = SnippetModel.fromJson(json, @design)

      expect(deserialize).toThrow()


  describe 'of a single snippet', ->

    beforeEach ->
      @json = test.localstore
        identifier: 'test.title'
        editables:
          'title': 'Baby Geniuses'


    it 'returns a snippet instance', ->
      snippet = SnippetModel.fromJson(@json, @design)
      expect(snippet instanceof SnippetModel).toEqual(true)
      expect(snippet.get('title')).toEqual('Baby Geniuses')


  describe 'of a snippet with styles', ->

    beforeEach ->
      @json = test.localstore
        identifier: 'test.hero'
        styles:
          'Color': 'color--blue'


    it 'returns a snippet with its styles', ->
      snippet = SnippetModel.fromJson(@json, @design)
      expect(snippet.style('Color')).toEqual('color--blue')


  describe 'of a snippet with invalid styles', ->

    beforeEach ->
      @json = test.localstore
        identifier: 'test.hero'
        styles:
          'Color': 'no-color-at-all'


    it 'returns a snippet with its styles', ->
      snippet = SnippetModel.fromJson(@json, @design)
      expect(snippet.style('Color')).toEqual(undefined)


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
      row = SnippetModel.fromJson(@rowJson, @design)
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


    it 'ignores null containers', ->
      @rowJson.containers.sidebar = null
      deserialize = =>
        snippet = SnippetModel.fromJson(@rowJson, @design)

      expect(deserialize).not.toThrow()


    it 'throws an error if container is not an array', ->
      @rowJson.containers.sidebar = 'this makes no sense at all'
      deserialize = =>
        snippet = SnippetModel.fromJson(@rowJson, @design)

      expect(deserialize).toThrow()


    it 'throws an error if it encouters an unknown containerName', ->
      @rowJson.containers.sidebarExtra = []
      deserialize = =>
        snippet = SnippetModel.fromJson(@rowJson, @design)

      expect(deserialize).toThrow()


describe 'Serialize and Deserialize', ->

  beforeEach ->
    @design = test.getDesign()
    @before = new SnippetTree()
    @row = test.getSnippet('row')
    @title = test.getSnippet('title')
    @title.set('title', 'What we have here is a failure to communicate')
    @row.append('sidebar', @title)
    @before.append(@row)
    @json = test.localstore(@before.toJson())
    @after = new SnippetTree(content: @json, design: @design)
    @afterTitle = @after.find('title').first


  it 'deserializes the whole tree', ->
    expect(@afterTitle.get('title')).toEqual('What we have here is a failure to communicate')


  it 'preserves snippet ids', ->
    expect(@afterTitle.id.length).toBeGreaterThan(10)
    expect(@title.id).toEqual(@afterTitle.id)


