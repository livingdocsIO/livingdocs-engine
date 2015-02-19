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


  it 'has found all metadata on init', ->
    metadata = @extractor.getMetadata()
    expect(metadata.title.content).to.equal('Hero Title')
    expect(metadata.description.content).to.equal('Title Title')


  it 'rechecks a component', ->
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
