assert = require('../modules/logging/assert')

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
        if !fields[match.field]
          if match.type == 'text'
            fields[match.field] = @extractTextField(componentModel, match.directive)
          else if match.type == 'image'
            fields[match.field] = @extractImageField(componentModel, match.directive, match.data.imageRatios)
          else
            assert false, "Unknown template type #{match.type}"


  extractTextField: (componentModel, directive) ->
    content = componentModel.get(directive)

    content: content
    component: componentModel
    field: directive
    text: $("<div>#{ content }</div>").text()
    type: 'text'


  extractImageField: (componentModel, directive, imageRatios) ->
    image = componentModel.directives.get(directive)
    return unless image?

    component: componentModel
    field: directive
    image:
      originalUrl: image.getOriginalUrl()
      url: image.getImageUrl()
      width: image.getOriginalImageDimensions()?.width
      height: image.getOriginalImageDimensions()?.height
      imageService: image.getImageServiceName()


  parseConfig: (metadataConfig) ->
    @matches = []
    for fieldConfig in metadataConfig
      field = fieldConfig.identifier
      type = fieldConfig.type

      for pattern in fieldConfig.matches
        [template, directive] = pattern.split('.')
        @matches.push
          field: field
          type: type
          template: template
          directive: directive
          data: @getDataForType(type, fieldConfig)


  getDataForType: (type, fieldConfig) ->
    switch type
      when 'image'
        imageRatios: fieldConfig.imageRatios


  getMatches: ->
    @matches


  getFields: ->
    @fields


