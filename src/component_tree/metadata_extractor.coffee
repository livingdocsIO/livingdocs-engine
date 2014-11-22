module.exports = class MetadataExtractor

  constructor: (@componentTree, config) ->
    @parseConfig(config)
    @metadata = null


  parseConfig: (metadataConfiguration) ->
    @matches = []
    for field, fieldValue of metadataConfiguration
      for pattern in fieldValue.matches
        [template, directive] = pattern.split('.')
        @matches.push
          'field': field
          'template': template
          'directive': directive


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
    @componentTree.each (componentModel) =>
      for match in @matches
        if componentModel.componentName == match.template
          content = componentModel.get(match.directive)
          if !metadata[match.field]
            metadata[match.field] =
              'content': content,
              'component': componentModel,
              'field': match.directive

    metadata


  updateContent_: ->
    for field, value of @metadata
      component = value.component
      if component
        content = component.get(value.field)
        @metadata[field].content = content
