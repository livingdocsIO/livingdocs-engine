assert = require('../modules/logging/assert')

module.exports = class FieldExtractor

  constructor: (@componentTree, @metadataConfig) ->
    @fields = {}
    @initEvents()
    # start by extracting everything
    @extractAll()
    @setupListeners()


  setupListeners: ->

    @componentTree.componentAdded.add $.proxy(@extractAll, this)
    @componentTree.componentRemoved.add $.proxy(@extractAll, this)
    @componentTree.componentMoved.add $.proxy(@extractAll, this)

    # change only needs to re-check the component
    @componentTree.componentContentChanged.add $.proxy(@recheckComponent, this)


  extractAll: (componentModel) ->
    @fields = @extractFieldsFromTree()
    @fieldsChanged.fire(@fields, @fields)
    @fields


  recheckComponent: (componentModel) ->
    changedFields = {}
    previouslyUsedFieldWasCleared = @extractFieldsFromComponent(componentModel, changedFields)

    if previouslyUsedFieldWasCleared
      @extractAll()
    else
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
    previouslyUsedFieldWasCleared = false
    for match in @metadataConfig.getFieldMatches()

      if componentModel.componentName == match.template
        directiveModel = componentModel.directives.get(match.directive)

        fieldWasNotMatchedBefore = !fields[match.field]
        directiveModelHadContent = !!@fields[match.field]
        directiveShouldBeExtracted = (!directiveModel.isEmpty() || directiveModelHadContent)

        if fieldWasNotMatchedBefore && directiveShouldBeExtracted

          if directiveModel.isEmpty()
            previouslyUsedFieldWasCleared = true
            fields[match.field] = undefined

          else if match.type == 'text'
            fields[match.field] = @extractTextField(componentModel, match.directive)

          else if match.type == 'image'
            if !directiveModel.isBase64()
              fields[match.field] = @extractImageField(componentModel, directiveModel, match.directive)

          else
            assert false, "Unknown template type #{match.type}"

    previouslyUsedFieldWasCleared


  extractTextField: (componentModel, directive) ->
    content = componentModel.get(directive)

    content: content
    component: componentModel
    field: directive
    text: $("<div>#{ content }</div>").text()
    type: 'text'


  extractImageField: (componentModel, imageDirective, directiveName) ->

    component: componentModel
    field: directiveName
    type: 'image'
    image:
      originalUrl: imageDirective.getOriginalUrl()
      url: imageDirective.getImageUrl()
      width: imageDirective.getOriginalImageDimensions()?.width
      height: imageDirective.getOriginalImageDimensions()?.height
      imageService: imageDirective.getImageServiceName()


  getFields: ->
    @fields
