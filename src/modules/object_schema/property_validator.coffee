# Property Validator
# ------------------

module.exports = class PropertyValidator
  termRegex = /\w[\w ]*\w/g

  constructor: ({ @inputString, @property, @schemaName, @parent, @validator }) ->
    @validators = []
    @location = @getLocation()
    @parent.addRequiredProperty(@property) if @parent?
    @addValidations(@inputString)


  getLocation: ->
    if not @parent?
      @schemaName
    else if @parent.location
      @parent.location + ".#{ @property }"
    else
      @property


  addValidations: (configString) ->
    while result = termRegex.exec(configString)
      term = result[0]
      if term == 'optional'
        @isOptional = true
        @parent.removeRequiredProperty(@property)
      else if term.indexOf('array of ') == 0
        @validators.push('array')
        @arrayValidator = term.slice(9)
      else if term.indexOf(' or ') != -1
        types = term.split(' or ')
        console.log('todo')
      else
        @validators.push(term)

    undefined


  validate: (value) ->
    validators = @validator.validators
    for name in @validators || []
      validate = validators[name]
      if validate?
        res = validate(value)
        continue if res == true
        return "#{ name } validator failed" if res == false
        return "#{ res }"
      else
       return "missing validator #{ name }"

    return error if error = @validateRequiredProperties(value)
    return error if error = @validateArray(value)

    undefined


  validateArray: (value) ->
    return undefined unless @arrayValidator?

    validate = @validator.validators[@arrayValidator]
    if validate?
      for entry, index in value
        res = validate(entry)

        # todo: dry this up (duplicate code in @validate() and objectSchema.addParentValidator())
        return undefined if res == true
        return "#{ name } validator failed" if res == false

        regexRes = /[\[.].*:.*/.exec(res)
        if regexRes?
          return "[#{ index }]#{ regexRes[0] }"
        else
          return "[#{ index }] #{ res }"

      return undefined

    return "missing validator #{ @arrayValidator }"


  validateMissingProperty: (key, value) ->
    undefined


  validateRequiredProperties: (obj) ->
    for key, isRequired of @requiredProperties
      return "#{ @validator.writeProperty(key) }: required property missing" if not obj[key]? && isRequired

    undefined


  addRequiredProperty: (key) ->
    @requiredProperties ?= {}
    @requiredProperties[key] = true


  removeRequiredProperty: (key) ->
    @requiredProperties[key] = undefined

