ComponentTree = require('../../../src/component_tree/component_tree')
ComponentModel = require('../../../src/component_tree/component_model')
componentModelSerializer = require('../../../src/component_tree/component_model_serializer')
base64Image = require('../../support/test_base64_image')

describe 'Snippet Serialization', ->

  describe 'empty snippet', ->

    it 'gets saved', ->
      json = test.getComponent('title').toJson()
      expect(json.identifier).to.equal('test.title')


  describe 'title snippet', ->

    it 'saves the titles value', ->
      title = test.getComponent('title')
      title.set('title', 'This is it!')
      json = title.toJson()
      expect(json).to.deep.equal
        id: json.id
        identifier: 'test.title'
        content:
          title: 'This is it!'


  describe 'of styles', ->

    it 'saves all styles', ->
      hero = test.getComponent('hero')
      hero.setStyle('extra-space', 'extra-space')
      hero.setStyle('color', 'color--blue')
      json = hero.toJson()
      expect(json.styles).to.deep.equal
        'extra-space': 'extra-space'
        'color': 'color--blue'

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

      hero = test.getComponent('hero')
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


describe 'ComponentTree Serialization', ->

  beforeEach ->
    { componentTree } = getInstances('componentTree')
    @tree = componentTree


  it 'saves an empty ComponentTree', ->
    json = @tree.toJson()
    expect(json.content).to.deep.equal([])


  it 'saves a componentTree with one snippet', ->
    @tree.append( test.getComponent('title') )
    json = @tree.toJson()
    expect(json.content[0].identifier).to.equal('test.title')


  it 'saves a componentTree with nested snippets', ->
    row = test.getComponent('row')
    row.append('main', test.getComponent('title'))
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
        snippet = componentModelSerializer.fromJson(json, @design)

      expect(deserialize).to.throw()


  describe 'of an invalid editable name', ->

    it 'throws an error', ->
      json =
        identifier: 'test.title'
        content:
          'title-misspelled': 'Baby Geniusses'

      deserialize = =>
        snippet = componentModelSerializer.fromJson(json, @design)

      expect(deserialize).to.throw()


  describe 'of a single snippet', ->

    beforeEach ->
      @json = test.localstore
        identifier: 'test.title'
        content:
          'title': 'Baby Geniuses'


    it 'returns a snippet instance', ->
      snippet = componentModelSerializer.fromJson(@json, @design)
      expect(snippet).to.be.an.instanceof(ComponentModel)
      expect(snippet.get('title')).to.equal('Baby Geniuses')


    it 'works with an identifier without a namespace', ->
      @json.identifier = 'title'
      snippet = componentModelSerializer.fromJson(@json, @design)
      expect(snippet).to.be.an.instanceof(ComponentModel)


  describe 'of a snippet with styles', ->

    beforeEach ->
      @json = test.localstore
        identifier: 'test.hero'
        styles:
          'color': 'color--blue'


    it 'returns a snippet with its styles', ->
      snippet = componentModelSerializer.fromJson(@json, @design)
      expect(snippet.getStyle('color')).to.equal('color--blue')


  describe 'of a snippet with invalid styles', ->

    beforeEach ->
      @json = test.localstore
        identifier: 'test.hero'
        styles:
          'color': 'no-color-at-all'


    it 'returns a snippet with its styles', ->
      snippet = componentModelSerializer.fromJson(@json, @design)
      expect(snippet.getStyle('color')).to.be.undefined


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
      snippet = componentModelSerializer.fromJson(@json, @design)
      expect(snippet.data('center')).to.deep.equal({'zoom': 12})


    it 'returns a snippet with its markers data', ->
      snippet = componentModelSerializer.fromJson(@json, @design)
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
      row = componentModelSerializer.fromJson(@rowJson, @design)
      firstChild = row.containers['main'].first
      secondChild = firstChild.next
      expect(firstChild.get('title')).to.equal('Do you feel lucky?')
      expect(secondChild.get('text')).to.equal('Well, do ya punk?')


    it 'fits as content for a componentTree', ->
      json =
        content: [@rowJson]

      expect()
      tree = new ComponentTree(content: json, design: @design)
      expect(tree.root.first).to.exist


    it 'ignores null containers', ->
      @rowJson.containers.sidebar = null
      deserialize = =>
        snippet = componentModelSerializer.fromJson(@rowJson, @design)

      expect(deserialize).not.to.throw()


    it 'throws an error if container is not an array', ->
      @rowJson.containers.sidebar = 'this makes no sense at all'
      deserialize = =>
        snippet = componentModelSerializer.fromJson(@rowJson, @design)

      expect(deserialize).to.throw()


    it 'throws an error if it encouters an unknown containerName', ->
      @rowJson.containers.sidebarExtra = []
      deserialize = =>
        snippet = componentModelSerializer.fromJson(@rowJson, @design)

      expect(deserialize).to.throw()


describe 'Serialize and Deserialize', ->

  beforeEach ->
    { @design, componentTree } = getInstances('componentTree')
    @before = componentTree
    @row = test.getComponent('row')
    @title = test.getComponent('title')
    @title.set('title', 'What we have here is a failure to communicate')
    @row.append('sidebar', @title)
    @before.append(@row)
    @json = test.localstore(@before.toJson())
    @after = new ComponentTree(content: @json, design: @design)
    @afterTitle = @after.find('title').first


  it 'deserializes the whole tree', ->
    expect(@afterTitle.get('title')).to.equal('What we have here is a failure to communicate')


  it 'preserves snippet ids', ->
    expect(@afterTitle.id.length).to.be.above(10)
    expect(@title.id).to.equal(@afterTitle.id)


