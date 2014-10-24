validators = require('./validators')

# Property Validator
# ------------------

module.exports = class PropertyValidator
  termRegex = /\w[\w ]*\w/g

  constructor: ({ @inputString, @property, @schemaName, @parent, @validator }) ->
    @validators = {}
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
      else if validators[term]?
        @validators[term] = validators[term]
      else if term.indexOf('array of ') == 0
        @validators['array'] = validators['array']
        @arraySchemaName = term.slice(9)
      else if term.indexOf(' or ') != -1
        types = term.split(' or ')
        console.log('todo')
      else
        @validators[term] = (value ) =>
          schema = @validator.schemas[term]
          if schema?
            message = @validator.__validate(schema, value).errors?[0]
            return if message? then message else true
          else
            return "missing schema #{ term }"

    undefined


  validate: (value) ->
    for name, validate of @validators
      res = validate(value)
      continue if res == true
      return "#{ name } validator failed" if res == false
      return "#{ res }"


    return error if error = @validateRequiredProperties(value)
    return error if error = @validateArray(value)

    undefined


  validateArray: (value) ->
    return undefined unless @arraySchemaName?

    arraySchema = @validator.schemas[@arraySchemaName]
    if arraySchema?
      for entry in value
        errors = @validator.__validate(arraySchema, entry).errors
        return errors if errors
      return undefined

    # This probably only makes sense for types, the lookup in
    # validators is a bit hacky like this...
    validateType = validators[@arraySchemaName]
    if validateType?
      for entry in value
        return "#{ @arraySchemaName } validator failed" if not validateType(entry)
      return undefined

    return "missing schema #{ @arraySchemaName }"


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

