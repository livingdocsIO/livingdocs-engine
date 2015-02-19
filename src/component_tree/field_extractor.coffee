module.exports = class FieldExtractor

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
    @fields = @extractFieldsFromTree()
    @fieldsChanged.fire(@fields, @fields)
    @fields


  recheckComponent: (componentModel) ->
    changedFields = {}
    @extractFieldsFromComponent(componentModel, changedFields)
    @fields = $.extend(@fields, changedFields) # NOTE: this is a shallow merge by design
    @fieldsChanged.fire(changedFields, @fields)
    { changedFields, @fields }


  initEvents: ->
    @fieldsChanged = $.Callbacks()


  extractFieldsFromTree: ->
    fields = {}
    @componentTree.each (componentModel) =>
      @extractFieldsFromComponent(componentModel, fields)
    fields


  extractFieldsFromComponent: (componentModel, fields) ->
    for match in @matches
      if componentModel.componentName == match.template
        content = componentModel.get(match.directive)
        if !fields[match.field]
          fields[match.field] =
            'content': content,
            'component': componentModel,
            'field': match.directive


  parseConfig: (metadataConfiguration) ->
    @matches = []
    for fieldItemConfig in metadataConfiguration
      field = fieldItemConfig.identifier
      type = fieldItemConfig.type

      for pattern in fieldItemConfig.matches
        [template, directive] = pattern.split('.')
        @matches.push
          'field': field
          'type': type
          'template': template
          'directive': directive


  getMatches: ->
    @matches


  getFields: ->
    @fields


