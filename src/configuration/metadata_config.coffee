module.exports = class MetadataConfig

  constructor: (config) ->
    @parse(config)


  parse: (config) ->
    @fieldMatches = []
    @configMap = {}

    for fieldItemConfig in config
      fieldName = fieldItemConfig.identifier
      type = fieldItemConfig.type
      @configMap[fieldName] = fieldItemConfig
      for pattern in fieldItemConfig.matches
        [template, directive] = pattern.split('.')
        isEditable = true
        isEditable = fieldItemConfig.isEditable if fieldItemConfig.isEditable?
        @fieldMatches.push
          field: fieldName
          type: type
          template: template
          directive: directive
          isEditable: isEditable


  getFieldMatches: ->
    @fieldMatches


  getConfigMap: ->
    @configMap
