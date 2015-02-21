assert = require('../modules/logging/assert')

module.exports = class FieldExtractor

  constructor: (@componentTree, @metadataConfig) ->
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
    for match in @metadataConfig.getFieldMatches()
      if componentModel.componentName == match.template
        directiveModel = componentModel.directives.get(match.directive)
        if !fields[match.field] && !directiveModel.isEmpty()
          if match.type == 'text'
            fields[match.field] = @extractTextField(componentModel, match.directive)
          else if match.type == 'image'
            unless directiveModel.isBase64()
              fields[match.field] = @extractImageField(componentModel, directiveModel, match.directive)
          else
            assert false, "Unknown template type #{match.type}"


  extractTextField: (componentModel, directive) ->
    content = componentModel.get(directive)

    content: content
    component: componentModel
    field: directive
    text: $("<div>#{ content }</div>").text()
    type: 'text'


  extractImageField: (componentModel, image, directive) ->

    component: componentModel
    field: directive
    type: 'image'
    image:
      originalUrl: image.getOriginalUrl()
      url: image.getImageUrl()
      width: image.getOriginalImageDimensions()?.width
      height: image.getOriginalImageDimensions()?.height
      imageService: image.getImageServiceName()


  getFields: ->
    @fields


