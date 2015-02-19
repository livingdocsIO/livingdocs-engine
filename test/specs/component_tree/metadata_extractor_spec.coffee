ComponentModel = require('../../../src/component_tree/component_model')
ComponentTree = require('../../../src/component_tree/component_tree')
MetadataExtractor = require('../../../src/component_tree/metadata_extractor')

describe 'metadata_extractor:', ->

  simpleConfig = [
    identifier: 'title'
    type: 'text'
    matches: ['hero.title', 'title.title']
  ,
    identifier: 'description'
    type: 'text'
    matches: ['title.title']
  ]

  beforeEach ->
    @tree = test.createComponentTree [
      hero: { title: 'Hero Title' },
      title: { title: 'Title Title' }
    ]
    @extractor = new MetadataExtractor @tree, simpleConfig


  it 'parses the config correctly', ->
    expect(@extractor.getMatches().length).to.equal(3)


  describe 'Matching', ->

    it 'uses the title from the hero component', ->
      metadata = @extractor.getMetadata()
      expect(metadata.title.content).to.equal('Hero Title')


    it 'uses the description from the title component', ->
      metadata = @extractor.getMetadata()
      expect(metadata.description.content).to.equal('Title Title')


    it 'uses the title from the title after moving it up', ->
      @tree.find('title').first.up()
      metadata = @extractor.getMetadata()
      expect(metadata.title.content).to.equal('Title Title')


  describe 'recheckComponent()', ->


    it 'rechecks a component', ->
      # NOTE: we create a new model so the events are not triggered
      newModel = test.getComponent('hero')
      newModel.set 'title', 'new Hero'
      { changedMetadata, metadata } = @extractor.recheckComponent(newModel)
      expect(Object.keys(changedMetadata).length).to.equal(1)
      expect(changedMetadata.title.content).to.equal('new Hero')
      expect(metadata.title.content).to.equal('new Hero')


    it 'rechecks a component with 2 matches', ->
      newModel = test.getComponent('title')
      newModel.set 'title', 'new Title'
      { changedMetadata, metadata } = @extractor.recheckComponent(newModel)
      expect(Object.keys(changedMetadata).length).to.equal(2)
      expect(changedMetadata.title.content).to.equal('new Title')
      expect(metadata.title.content).to.equal('new Title')


  describe 'Events', ->

    beforeEach ->
      @metadataChanged = sinon.spy(@extractor.metadataChanged, 'fire')

    it 'fires the metadataChanged event when changing content', ->
      model = @tree.find('hero').first
      model.set('title', 'new Hero')
      expect(@metadataChanged).to.have.been.calledOnce


    it 'fires the metadataChanged event when adding a component', ->
      @tree.append('title')
      expect(@metadataChanged).to.have.been.calledOnce


    it 'fires the metadataChanged event when removing a component', ->
      @tree.find('title').first.remove()
      expect(@metadataChanged).to.have.been.calledOnce


    it 'fires the metadataChanged event when moving a component', ->
      @tree.find('title').first.up()
      expect(@metadataChanged).to.have.been.calledOnce

