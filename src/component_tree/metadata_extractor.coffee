module.exports = class MetadataExtractor

  constructor: (@componentTree, config) ->
    @parseConfig(config)
    @initEvents()
    # start by extracting everything
    @extractAll()
    @setupListeners()



  # TODO: ignore empty fields
  # TODO when empty -> extract all
  # TODO fill up watchedComponent and empty containers
  setupListeners: ->
    # add / remove needs to re-check the structure of the document
    @componentTree.componentAdded.add $.proxy(@extractAll, this)
    @componentTree.componentRemoved.add $.proxy(@extractAll, this)
    @componentTree.componentMoved.add $.proxy(@extractAll, this)
    # change only needs to re-check the component (gets more complicated once we ignore empty fields)
    @componentTree.componentContentChanged.add $.proxy(@recheckComponent, this)


  extractAll: (componentModel) ->
    # TODO: reset and watch emptyThatWouldHaveBeenTaken (for changed)
    # TODO: reset and watch takenComponents (for changed)
    @metadata = @extractMetadataFromTree()
    @metadataChanged.fire(@metadata, @metadata)
    @metadata


  recheckComponent: (componentModel) ->
    changedMetadata = {}
    @extractMetadataFromComponent(componentModel, changedMetadata)
    @metadata = $.extend(@metadata, changedMetadata) # NOTE: this is a shallow merge by design
    @metadataChanged.fire(changedMetadata, @metadata)
    { changedMetadata, @metadata }


  initEvents: ->
    @metadataChanged = $.Callbacks()


  extractMetadataFromTree: ->
    metadata = {}
    @componentTree.each (componentModel) =>
      @extractMetadataFromComponent(componentModel, metadata)
    metadata


  extractMetadataFromComponent: (componentModel, metadata) ->
    for match in @matches
      if componentModel.componentName == match.template
        content = componentModel.get(match.directive)
        if !metadata[match.field]
          metadata[match.field] =
            'content': content,
            'component': componentModel,
            'field': match.directive


  parseConfig: (metadataConfiguration) ->
    @matches = []
    for metadataItemConfig in metadataConfiguration
      field = metadataItemConfig.identifier
      type = metadataItemConfig.type

      for pattern in metadataItemConfig.matches
        [template, directive] = pattern.split('.')
        @matches.push
          'field': field
          'type': type
          'template': template
          'directive': directive


  getMatches: ->
    @matches


  getMetadata: ->
    @metadata


