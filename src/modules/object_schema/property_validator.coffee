validators = require('./validators')

# Property Validator
# ------------------

module.exports = class PropertyValidator
  termRegex = /\w[\w ]*\w/g

  constructor: ({ @inputString, @property, @parent, @validator }) ->
    @validators = {}
    @setLocation()
    @parent.addRequiredProperty(@property) if @parent?
    @addValidations(@inputString)


  setLocation: ->
    @location = if @parent?
      if @parent.location
        @parent.location + ".#{ @property }"
      else
        @property
    else
      ''


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
        if not @childSchemaName?
          @childSchemaName = term
        else
          console.log "term not found: #{ term }"

    undefined


  validate: (value) ->
    for name, validate of @validators
      return "#{ name } validator failed" unless validate(value)

    return error if error = @validateRequiredProperties(value)
    return error if error = @validateChildSchema(value)
    return error if error = @validateArray(value)

    undefined


  validateChildSchema: (value) ->
    return undefined unless @childSchemaName?

    childSchema = @validator.schemas[@childSchemaName]
    if childSchema?
      return @validator.__validate(childSchema, value).errors?[0]
    else
      return "missing schema #{ @childSchemaName }"


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
      return "require property #{ key }" if not obj[key]? && isRequired

    undefined


  addRequiredProperty: (key) ->
    @requiredProperties ?= {}
    @requiredProperties[key] = true


  removeRequiredProperty: (key) ->
    @requiredProperties[key] = undefined

