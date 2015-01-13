ComponentTree = require('../../../src/component_tree/component_tree')
ComponentModel = require('../../../src/component_tree/component_model')
componentModelSerializer = require('../../../src/component_tree/component_model_serializer')
base64Image = require('../../support/test_base64_image')

describe 'serialization:', ->

  describe 'empty component', ->

    it 'gets saved', ->
      json = test.getComponent('title').toJson()
      expect(json.identifier).to.equal('test.title')


  describe 'title component', ->

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
    { componentTree } = test.get('componentTree')
    @tree = componentTree


  it 'saves an empty ComponentTree', ->
    json = @tree.toJson()
    expect(json.content).to.deep.equal([])


  it 'saves a componentTree with one component', ->
    @tree.append( test.getComponent('title') )
    json = @tree.toJson()
    expect(json.content[0].identifier).to.equal('test.title')


  it 'saves a componentTree with nested components', ->
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


  describe 'of an in-exstistant component', ->

    it 'throws an error', ->
      json = { identifier: 'unknown-component' }

      deserialize = =>
        componentModelSerializer.fromJson(json, @design)

      expect(deserialize).to.throw()


  describe 'of an invalid editable name', ->

    it 'throws an error', ->
      json =
        identifier: 'test.title'
        content:
          'title-misspelled': 'Baby Geniusses'

      deserialize = =>
        componentModelSerializer.fromJson(json, @design)

      expect(deserialize).to.throw()


  describe 'of a single component', ->

    beforeEach ->
      @json = test.deepclone
        identifier: 'test.title'
        content:
          'title': 'Baby Geniuses'


    it 'returns a component instance', ->
      component = componentModelSerializer.fromJson(@json, @design)
      expect(component).to.be.an.instanceof(ComponentModel)
      expect(component.get('title')).to.equal('Baby Geniuses')


    it 'works with an identifier without a namespace', ->
      @json.identifier = 'title'
      component = componentModelSerializer.fromJson(@json, @design)
      expect(component).to.be.an.instanceof(ComponentModel)


  describe 'of a component with styles', ->

    beforeEach ->
      @json = test.deepclone
        identifier: 'test.hero'
        styles:
          'color': 'color--blue'


    it 'returns a component with its styles', ->
      component = componentModelSerializer.fromJson(@json, @design)
      expect(component.getStyle('color')).to.equal('color--blue')


  describe 'of a component with invalid styles', ->

    beforeEach ->
      @json = test.deepclone
        identifier: 'test.hero'
        styles:
          'color': 'no-color-at-all'


    it 'returns a component with its styles', ->
      component = componentModelSerializer.fromJson(@json, @design)
      expect(component.getStyle('color')).to.be.undefined


  describe 'of a component with data', ->

    beforeEach ->
      @json = test.deepclone
        identifier: 'test.hero'
        data:
          'center':
            'zoom': 12
          'markers': [
            'text': 'test'
          ,
            'text': 'test2'
          ]


    it 'returns a component with its center data', ->
      component = componentModelSerializer.fromJson(@json, @design)
      expect(component.data('center')).to.deep.equal({'zoom': 12})


    it 'returns a component with its markers data', ->
      component = componentModelSerializer.fromJson(@json, @design)
      expect(component.data('markers')).to.deep.equal([{'text': 'test'}, {'text': 'test2'}])


  describe 'of a component with children', ->

    beforeEach ->
      @rowJson = test.deepclone
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


    it 'returns a component instance', ->
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
        componentModelSerializer.fromJson(@rowJson, @design)

      expect(deserialize).not.to.throw()


    it 'throws an error if container is not an array', ->
      @rowJson.containers.sidebar = 'this makes no sense at all'
      deserialize = =>
        componentModelSerializer.fromJson(@rowJson, @design)

      expect(deserialize).to.throw()


    it 'throws an error if it encouters an unknown containerName', ->
      @rowJson.containers.sidebarExtra = []
      deserialize = =>
        componentModelSerializer.fromJson(@rowJson, @design)

      expect(deserialize).to.throw()


describe 'Serialize and Deserialize', ->

  beforeEach ->
    { @design, componentTree } = test.get('componentTree')
    @before = componentTree
    @row = test.getComponent('row')
    @title = test.getComponent('title')
    @title.set('title', 'What we have here is a failure to communicate')
    @row.append('sidebar', @title)
    @before.append(@row)
    @json = test.deepclone(@before.toJson())
    @after = new ComponentTree(content: @json, design: @design)
    @afterTitle = @after.find('title').first


  it 'deserializes the whole tree', ->
    expect(@afterTitle.get('title')).to.equal('What we have here is a failure to communicate')


  it 'preserves component ids', ->
    expect(@afterTitle.id.length).to.be.above(10)
    expect(@title.id).to.equal(@afterTitle.id)


