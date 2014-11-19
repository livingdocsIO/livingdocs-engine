module.exports = class MetadataExtractor

  constructor: (@componentTree, config) ->
    @parseConfig(config)
    @metadata = null


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


  # Todo: Listen to componentTree events to invalidate automatically
  invalidateCache: ->
    @metadata = null


  extract: ->
    if @metadata
      @updateContent_()
    else
      @metadata = @extractMetadataFromTree_()

    @metadata


  extractMetadataFromTree_: ->
    metadata = {}
    @extractionCache = {}
    @componentTree.each (componentModel) =>
      for match in @matches
        if componentModel.componentName == match.templateId
          content = componentModel.get(match.templateField)
          if !metadata[match.field]
            metadata[match.field] =
              'content': content,
              'component': componentModel,
              'field': match.templateField

    metadata


  updateContent_: ->
    for field, value of @metadata
      component = value.component
      if component
        content = component.get(value.field)
        @metadata[field].content = content
