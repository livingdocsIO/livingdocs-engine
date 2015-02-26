assert = require('../modules/logging/assert')
MetadataConfig = require('../configuration/metadata_config')
_ = require('underscore')

module.exports = class FieldExtractor

  constructor: (@componentTree, metadataConfigJSON) ->
    @metadataConfig = new MetadataConfig(metadataConfigJSON)
    @fields = {}
    @initEvents()
    # start by extracting everything
    @extractAll()
    @setupListeners()


  setupListeners: ->

    @componentTree.componentAdded.add(@extractAll)
    @componentTree.componentRemoved.add(@extractAll)
    @componentTree.componentMoved.add(@extractAll)

    # change only needs to re-check the component
    @componentTree.componentContentChanged.add(@recheckComponent)


  extractAll: =>
    allFields = Object.keys(@metadataConfig.getConfigMap())

    @fields = @extractFields(allFields)
    @fieldsChanged.fire(@fields, @fields)
    @fields


  extractFields: (fieldsToExtract) ->
    fields = {}
    fieldsByComponents = {}

    _(@metadataConfig.getComponentMap())
      .forEach (fieldsByComponent, componentName) ->
        fieldsByComponents[componentName] = _.intersection(
          fieldsByComponent
          fieldsToExtract
        )

    @componentTree.each (componentModel) =>
      componentName = componentModel.componentName

      return unless fieldsByComponents[componentName]?.length

      newFields = @extractFieldsFromComponent(
        componentModel,
        fieldsByComponents[componentName]
      )

      _(newFields).forEach (field, fieldName) =>

        _(fieldsByComponents).forEach (fieldsByComponent, componentName) =>
          fieldsByComponents[componentName] = _.without(
            fieldsByComponent,
            fieldName
          )
        fields[fieldName] = field

    fields


  extractFieldsFromComponent: (componentModel, fieldsToExtract) ->
    fields = {}
    componentName = componentModel.componentName;
    fieldsToExtract.forEach (fieldToExtract) =>
      directives = @metadataConfig.getDirectivesByComponentAndField(componentName, fieldToExtract)

      directives.forEach (directiveName) =>
        return if fields[fieldToExtract]
        directiveModel = componentModel.directives.get(directiveName)
        return if directiveModel.isEmpty()

        field = @extractFieldFromDirective(directiveModel, fieldToExtract)
        fields[fieldToExtract] = field
    fields


  recheckComponent: (componentModel, directive) =>
    componentName = componentModel.componentName
    fieldNames = @metadataConfig.getFieldsBySource(componentName, directive)

    changedFields = {}
    fieldsThatNeedFullExtraction = []

    _(fieldNames).forEach (fieldName) =>

      directiveModel = componentModel.directives.get(directive);

      field = if directiveModel.isEmpty()
        undefined
      else
        @extractFieldFromDirective(directiveModel, fieldName)

      fieldWasFilledFromThisComponent = @fields[fieldName].component.id is componentModel.id

      if !field && fieldWasFilledFromThisComponent
        fieldsThatNeedFullExtraction.push(fieldName)
        @fields[fieldName] = changedFields[fieldName] = undefined

      else if fieldWasFilledFromThisComponent
        @fields[fieldName] = changedFields[fieldName] = field

    if fieldsThatNeedFullExtraction.length
      _(@extractFields(fieldsThatNeedFullExtraction)).forEach (field, fieldName) =>
        @fields[fieldName] = changedFields[fieldName] = field

    if _(changedFields).size()
      @fieldsChanged.fire(changedFields, @fields)


  initEvents: ->
    @fieldsChanged = $.Callbacks()


  extractFieldFromDirective: (directiveModel, fieldToExtract) ->
    type = @metadataConfig.getConfigMap()[fieldToExtract].type

    if type == 'text'
      value = @extractTextField(directiveModel)

    else if type == 'image'
      if !directiveModel.isBase64()
        value = @extractImageField(directiveModel)

    else
      assert false, "Unknown template type #{type}"


  extractTextField: (directiveModel) ->
    content = directiveModel.getContent()

    content: content
    component: directiveModel.component
    field: directiveModel.name
    text: $("<div>#{ content }</div>").text()
    type: 'text'


  extractImageField: (imageDirective) ->

    component: imageDirective.component
    field: imageDirective.name
    type: 'image'
    image:
      originalUrl: imageDirective.getOriginalUrl()
      url: imageDirective.getImageUrl()
      width: imageDirective.getOriginalImageDimensions()?.width
      height: imageDirective.getOriginalImageDimensions()?.height
      imageService: imageDirective.getImageServiceName()


  getFields: ->
    @fields
