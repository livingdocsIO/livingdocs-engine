module.exports = class MetadataExtractor

  constructor: (@componentTree, config) ->
    @parseConfig(config)
    @extractionCache = null


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
    @extractionCache = null


  extract: ->
    if @extractionCache
      @extractWithCache_()
    else
      @extractFromTree_()


  extractFromTree_: ->
    metadata = {}
    @extractionCache = {}
    @componentTree.all (componentModel) =>
      for match in @matches
        if componentModel.componentName == match.templateId
          content = componentModel.get(match.templateField)
          if !metadata[match.field]
            metadata[match.field] = content
            @extractionCache[match.field] =
              'componentId': componentModel.id
              'templateField': match.templateField

    metadata


  extractWithCache_: ->
    metadata = {}
    for field, pointer of @extractionCache
      component = @getComponentByGuid(pointer.componentId)
      if component
        content = component.get(pointer.templateField)
        metadata[field] = content

    metadata


  # Temporal hack as proof of concept
  getComponentByGuid: (guid) ->
    result = null
    @componentTree.all (componentModel) ->
      if componentModel.id == guid
        result = componentModel

    return result

