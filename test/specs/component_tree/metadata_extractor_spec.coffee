ComponentModel = require('../../../src/component_tree/component_model')
ComponentTree = require('../../../src/component_tree/component_tree')
MetadataExtractor = require('../../../src/component_tree/metadata_extractor')

describe 'metadata_extractor:', ->

  simpleConfig =
    "title":
      matches: ["hero.title", "title.title"]
    "description":
      matches: ["title.title"]

  tree = test.createComponentTree [
    hero: { title: 'Hero Title' },
    title: { title: 'Title Title' }
  ]

  beforeEach ->
    @tree = test.get('componentTree')
    @extractor = new MetadataExtractor tree, simpleConfig

  it 'has configured exactly three matches', ->
    expect(@extractor.getMatches().length).to.equal(3)

  it 'has found all metadata', ->
    metadata = @extractor.extract()
    expect(metadata.title).to.equal('Hero Title')
    expect(metadata.description).to.equal('Title Title')