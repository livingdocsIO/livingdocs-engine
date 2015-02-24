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


  it 'parses matches from the metadata configuration', ->
    expect(@metadataConfig.getFieldMatches()).to.have.deep.members [
      field: 'title'
      type: 'text'
      template: 'hero'
      directive: 'title'
      isEditable: true
    ,
      field: 'title'
      type: 'text'
      template: 'title'
      directive: 'title'
      isEditable: true
    ,
      field: 'teaser'
      type: 'image'
      template: 'cover'
      directive: 'image'
      isEditable: true
    ]


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


