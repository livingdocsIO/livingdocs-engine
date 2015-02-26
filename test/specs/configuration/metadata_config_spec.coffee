MetadataConfig = require('../../../src/configuration/metadata_config')

describe 'Metadata Config', ->

  simpleConfig = [
    identifier: 'title'
    type: 'text'
    matches: ['hero.title', 'title.title']
  ,
    identifier: 'teaser'
    type: 'image'
    matches: ['cover.image']
  ]


  beforeEach ->
    @metadataConfig = new MetadataConfig(simpleConfig)


  it 'builds the config map correctly', ->
    expect(@metadataConfig.getConfigMap()).to.deep.equal
      title:
        identifier: 'title'
        type: 'text'
        matches: ['hero.title', 'title.title']
      teaser:
        identifier: 'teaser'
        type: 'image'
        matches: ['cover.image']

  it 'returns directives by component and field', ->
    expect(
      @metadataConfig.getDirectivesByComponentAndField('cover', 'teaser')
    ).to.deep.equal(['image'])

  it 'returns fields by component and directive', ->
    expect(
      @metadataConfig.getFieldsBySource('cover', 'image')
    ).to.deep.equal(['teaser'])

  it 'returns the component map', ->
     expect(
      @metadataConfig.getComponentMap('cover', 'image')
    ).to.deep.equal({
      hero: ['title'],
      title: ['title'],
      cover: ['teaser']
    })
