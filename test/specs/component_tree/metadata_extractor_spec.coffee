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

  tree = test.createComponentTree [
    hero: { title: 'Hero Title' },
    title: { title: 'Title Title' }
  ]

  beforeEach ->
    @tree = test.get('componentTree')
    @extractor = new MetadataExtractor tree, simpleConfig


  it 'has configured exactly three matches', ->
    expect(@extractor.getMatches().length).to.equal(3)


  it 'has found all metadata on init', ->
    metadata = @extractor.getMetadata()
    expect(metadata.title.content).to.equal('Hero Title')
    expect(metadata.description.content).to.equal('Title Title')

