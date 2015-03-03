module.exports = class MetadataConfig

  constructor: (config) ->
    @fieldsArray = []
    @editableFieldsArray = []
    @fieldMap = {}
    @configMap = {}
    @componentDirectiveMap = {}
    @componentMap = {}
    @parse(config) if config? && config.length


  parse: (config) ->
    for fieldItemConfig in config
      fieldName = fieldItemConfig.identifier
      type = fieldItemConfig.type

      @fieldsArray.push(fieldName)
      @configMap[fieldName] = fieldItemConfig
      @fieldMap[fieldName] ?= {}

      isEditable = if fieldItemConfig.isEditable? then !!fieldItemConfig.isEditable else true
      @editableFieldsArray.push(fieldName) if isEditable

      for pattern in fieldItemConfig.matches
        [componentName, directive] = pattern.split('.')

        @componentDirectiveMap[componentName] ?= {}
        @componentDirectiveMap[componentName][directive] ?= []
        @componentDirectiveMap[componentName][directive].push(fieldName)

        @componentMap[componentName] ?= []
        @componentMap[componentName].push(fieldName)

        @fieldMap[fieldName][componentName] ?= []
        @fieldMap[fieldName][componentName].push(directive)




  getListOfEditableFields: -> @editableFieldsArray


  getListOfFields: -> @fieldsArray


  getConfigMap: -> @configMap


  getComponentMap: -> @componentMap


  getFieldsBySource: (componentName, directive) ->
    @componentDirectiveMap[componentName]?[directive] || []


  getDirectivesByComponentAndField: (componentName, fieldName) ->
    @fieldMap[fieldName][componentName]
