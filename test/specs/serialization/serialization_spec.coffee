SnippetTree = require('../../../src/snippet_tree/snippet_tree')
SnippetModel = require('../../../src/snippet_tree/snippet_model')
TestImage = require('../../support/test_base64_image')

describe 'Snippet Serialization', ->

  describe 'empty snippet', ->

    it 'gets saved', ->
      json = test.getSnippet('title').toJson()
      expect(json.identifier).to.equal('test.title')


  describe 'title snippet', ->

    it 'saves the titles value', ->
      expectedValue = 'This is it!'
      title = test.getSnippet('title')
      title.set('title', expectedValue)
      json = title.toJson()
      expect(json.content['title']).to.equal(expectedValue)


  describe 'of styles', ->

    it 'saves all styles', ->
      hero = test.getSnippet('hero')
      hero.style('Extra Space', 'extra-space')
      hero.style('Color', 'color--blue')
      json = hero.toJson()
      expect(json.styles).to.deep.equal
        'Extra Space': 'extra-space'
        'Color': 'color--blue'

  describe 'of data', ->

    it 'saves all data', ->
      expectedValue =
        'center':
          'zoom': 12
        'markers': [
          'text': 'test'
        ,
          'text': 'secondTest'
        ]

      hero = test.getSnippet('hero')
      hero.data(
        'center':
          'zoom': 12
      )

      hero.data(
        'markers': [
          'text': 'test'
        ,
          'text': 'secondTest'
        ])

      json = hero.toJson()
      expect(json.data).to.deep.equal(expectedValue)


  describe 'of temporaryContent', ->

    it 'does not save a session value', ->
      cover = test.getSnippet('cover')
      cover.set('image', TestImage, 'temporaryOverride')
      json = cover.toJson()
      expect(json.temporaryContent).to.be.undefined
      expect(json.content.image).to.be.undefined



describe 'SnippetTree Serialization', ->

  beforeEach ->
    { snippetTree } = getInstances('snippetTree')
    @tree = snippetTree


  it 'saves an empty SnippetTree', ->
    json = @tree.toJson()
    expect(json.content).to.deep.equal([])


  it 'saves a snippet tree with one snippet', ->
    @tree.append( test.getSnippet('title') )
    json = @tree.toJson()
    expect(json.content[0].identifier).to.equal('test.title')


  it 'saves a snippet tree with nested snippets', ->
    row = test.getSnippet('row')
    row.append('main', test.getSnippet('title'))
    @tree.append(row)
    json = @tree.toJson()
    first = json.content[0]
    expect(first.identifier).to.equal('test.row')
    expect(first.containers['main'][0].identifier).to.equal('test.title')
    expect(first.containers['sidebar']).to.deep.equal([])


describe 'Deserialization', ->

  beforeEach ->
    @design = test.getDesign()


  describe 'of an in-exstistant snippet', ->

    it 'throws an error', ->
      json = { identifier: 'unknown-snippet' }

      deserialize = =>
        snippet = SnippetModel.fromJson(json, @design)

      expect(deserialize).to.throw()


  describe 'of an invalid editable name', ->

    it 'throws an error', ->
      json =
        identifier: 'test.title'
        content:
          'title-misspelled': 'Baby Geniusses'

      deserialize = =>
        snippet = SnippetModel.fromJson(json, @design)

      expect(deserialize).to.throw()


  describe 'of a single snippet', ->

    beforeEach ->
      @json = test.localstore
        identifier: 'test.title'
        content:
          'title': 'Baby Geniuses'


    it 'returns a snippet instance', ->
      snippet = SnippetModel.fromJson(@json, @design)
      expect(snippet).to.be.an.instanceof(SnippetModel)
      expect(snippet.get('title')).to.equal('Baby Geniuses')


  describe 'of a snippet with styles', ->

    beforeEach ->
      @json = test.localstore
        identifier: 'test.hero'
        styles:
          'Color': 'color--blue'


    it 'returns a snippet with its styles', ->
      snippet = SnippetModel.fromJson(@json, @design)
      expect(snippet.style('Color')).to.equal('color--blue')


  describe 'of a snippet with invalid styles', ->

    beforeEach ->
      @json = test.localstore
        identifier: 'test.hero'
        styles:
          'Color': 'no-color-at-all'


    it 'returns a snippet with its styles', ->
      snippet = SnippetModel.fromJson(@json, @design)
      expect(snippet.style('Color')).to.be.undefined


  describe 'of a snippet with data', ->

    beforeEach ->
      @json = test.localstore
        identifier: 'test.hero'
        data:
          'center':
            'zoom': 12
          'markers': [
            'text': 'test'
          ,
            'text': 'test2'
          ]


    it 'returns a snippet with its center data', ->
      snippet = SnippetModel.fromJson(@json, @design)
      expect(snippet.data('center')).to.deep.equal({'zoom': 12})


    it 'returns a snippet with its markers data', ->
      snippet = SnippetModel.fromJson(@json, @design)
      expect(snippet.data('markers')).to.deep.equal([{'text': 'test'}, {'text': 'test2'}])


  describe 'of a snippet with children', ->

    beforeEach ->
      @rowJson = test.localstore
        identifier : 'test.row',
        containers :
          main : [
            identifier : 'test.title'
            content : { 'title' : 'Do you feel lucky?' }
          ,
            identifier : 'test.text'
            content : { 'text' : 'Well, do ya punk?' }
          ]
          sidebar : []


    it 'returns a snippet instance', ->
      row = SnippetModel.fromJson(@rowJson, @design)
      firstChild = row.containers['main'].first
      secondChild = firstChild.next
      expect(firstChild.get('title')).to.equal('Do you feel lucky?')
      expect(secondChild.get('text')).to.equal('Well, do ya punk?')


    it 'fits as content for a snippetTree', ->
      json =
        content: [@rowJson]

      expect()
      tree = new SnippetTree(content: json, design: @design)
      expect(tree.root.first).to.exist


    it 'ignores null containers', ->
      @rowJson.containers.sidebar = null
      deserialize = =>
        snippet = SnippetModel.fromJson(@rowJson, @design)

      expect(deserialize).not.to.throw()


    it 'throws an error if container is not an array', ->
      @rowJson.containers.sidebar = 'this makes no sense at all'
      deserialize = =>
        snippet = SnippetModel.fromJson(@rowJson, @design)

      expect(deserialize).to.throw()


    it 'throws an error if it encouters an unknown containerName', ->
      @rowJson.containers.sidebarExtra = []
      deserialize = =>
        snippet = SnippetModel.fromJson(@rowJson, @design)

      expect(deserialize).to.throw()


describe 'Serialize and Deserialize', ->

  beforeEach ->
    { @design, snippetTree } = getInstances('snippetTree')
    @before = snippetTree
    @row = test.getSnippet('row')
    @title = test.getSnippet('title')
    @title.set('title', 'What we have here is a failure to communicate')
    @row.append('sidebar', @title)
    @before.append(@row)
    @json = test.localstore(@before.toJson())
    @after = new SnippetTree(content: @json, design: @design)
    @afterTitle = @after.find('title').first


  it 'deserializes the whole tree', ->
    expect(@afterTitle.get('title')).to.equal('What we have here is a failure to communicate')


  it 'preserves snippet ids', ->
    expect(@afterTitle.id.length).to.be.above(10)
    expect(@title.id).to.equal(@afterTitle.id)


