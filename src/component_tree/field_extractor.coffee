assert = require('../modules/logging/assert')
_ = require('underscore')

module.exports = class FieldExtractor

  constructor: (@componentTree, @metadataConfig) ->
    @fields = {}
    @initEvents()
    # start by extracting everything
    @extractAll()
    @setupListeners()


  setupListeners: ->

    @componentTree.componentAdded.add(@onTreeChange)
    @componentTree.componentRemoved.add(@onTreeChange)
    @componentTree.componentMoved.add(@onTreeChange)

    @componentTree.componentContentChanged.add(@onComponentChange)


  onTreeChange: (componentModel) =>
    componentName = componentModel.componentName
    fieldsToExtract = @metadataConfig.getComponentMap()[componentName]
    changedFields = {}
    fieldsHaveChanged = false

    for fieldName, field of @extractFields(fieldsToExtract) when !_.isEqual(@fields[fieldName], field)
      fieldsHaveChanged = true
      changedFields[fieldName] = @fields[fieldName] = field

    return unless fieldsHaveChanged

    @fieldsChanged.fire(changedFields, @fields)


  extractAll: =>
    allFields = Object.keys(@metadataConfig.getConfigMap())

    @fields = @extractFields(allFields)
    @fieldsChanged.fire(@fields, @fields)
    @fields


  extractFields: (fieldsToExtract) ->
    fields = {}

    # fieldsByComponentToExtract will look like that:
    #
    # fieldsByComponentToExtract = {
    #   'hero': ['documentTitle', 'tagline'],
    #   'title': ['documentTitle']
    #    ^         ^ metadata-field name
    #    | component name
    # }
    fieldsByComponentToExtract = {}


    _(@metadataConfig.getComponentMap())
      .forEach (fieldsByComponent, componentName) ->
        fieldsByComponentToExtract[componentName] = _.intersection(
          fieldsByComponent
          fieldsToExtract
        )

    @componentTree.each (componentModel) =>
      componentName = componentModel.componentName

      # Only search for a field if it has not been found before
      return unless fieldsByComponentToExtract[componentName]?.length

      newFields = @extractFieldsFromComponent(
        componentModel,
        fieldsByComponentToExtract[componentName]
      )

      _(newFields).forEach (field, fieldName) =>

        # When a field is matched, it is removed from the `fieldsByComponentToExtract`
        #
        # Say the `documentTitle` is matched, the `fieldsByComponentToExtract` goes from
        #
        #   {
        #     'hero': ['documentTitle', 'tagline'],
        #     'title': ['documentTitle']
        #   }
        #
        # to
        #
        #   {
        #     'hero': ['tagline'],
        #     'title': []
        #   }
        _(fieldsByComponentToExtract).forEach (fieldsByComponent, componentName) =>
          fieldsByComponentToExtract[componentName] = _.without(
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
        # Only search for a field if it has not been found before
        return if fields[fieldToExtract]

        directiveModel = componentModel.directives.get(directiveName)
        return if directiveModel.isEmpty()

        field = @extractFieldFromDirective(directiveModel, fieldToExtract)
        fields[fieldToExtract] = field
    fields


  onComponentChange: (componentModel, directiveName) =>
    componentName = componentModel.componentName
    fieldNames = @metadataConfig.getFieldsBySource(componentName, directiveName)

    changedFields = {}
    fieldsThatNeedFullExtraction = []

    directiveModel = componentModel.directives.get(directiveName);

    _(fieldNames).forEach (fieldName) =>

      field = if directiveModel.isEmpty()
        undefined
      else
        @extractFieldFromDirective(directiveModel, fieldName)

      fieldIsEmpty = !field?
      fieldWasEmpty = !@fields[fieldName]?
      fieldWasFilledFromThisComponent = @fields[fieldName]?.component.id == componentModel.id

      if fieldIsEmpty && fieldWasFilledFromThisComponent
        fieldsThatNeedFullExtraction.push(fieldName)

        @fields[fieldName] = changedFields[fieldName] = undefined

      else if (fieldWasEmpty || fieldWasFilledFromThisComponent) and !_.isEqual(@fields[fieldName], field)
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
    directiveName: directiveModel.name
    text: directiveModel.getText()
    type: 'text'


  extractImageField: (imageDirective) ->

    component: imageDirective.component
    directiveName: imageDirective.name
    type: 'image'
    image:
      originalUrl: imageDirective.getOriginalUrl()
      url: imageDirective.getImageUrl()
      width: imageDirective.getOriginalImageDimensions()?.width
      height: imageDirective.getOriginalImageDimensions()?.height
      imageService: imageDirective.getImageServiceName()


  getFields: ->
    @fields
