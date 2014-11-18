module.exports = class MetadataExtractor

  constructor: (@componentTree, config) ->
    @parseConfig(config)


  parseConfig: (metadataConfiguration) ->
    @matches = []
    for field, fieldValue of metadataConfiguration
      for pattern in fieldValue.matches
        [templateId, templateField] = pattern.split('.')
        @matches.push
          'field': field
          'templateId': templateId
          'templateField': templateField


  getMatches: ->
    @matches


  extract: ->
    metadata = {}
    @componentTree.all (componentModel) =>
      for match in @matches
        if componentModel.componentName == match.templateId
          content = componentModel.get(match.templateField)
          metadata[match.field] ?= content if content

    metadata