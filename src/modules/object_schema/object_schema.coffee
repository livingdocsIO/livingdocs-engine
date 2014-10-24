ValidationErrors = require('./validation_errors')

validators =
  'object': (value) -> $.type(value) == 'object'
  'string': (value) -> $.type(value) == 'string'
  'boolean': (value) -> $.type(value) == 'boolean'
  'number': (value) -> $.type(value) == 'number'
  'function': (value) -> $.type(value) == 'function'
  'date': (value) -> $.type(value) == 'date'
  'regexp': (value) -> $.type(value) == 'regexp'
  'array': (value) -> $.type(value) == 'array'
  'falsy': (value) -> !!value == false
  'truthy': (value) -> !!value == true
  'not empty': (value) -> !!value == true
  'deprecated': (value) -> true


module.exports = class ValidObj

  constructor: ->
    @schemas = {}


  add: (name, schema) ->
    @schemas[name] = @parseConfigObj(schema, undefined, name)


  addValidator: (name, method) ->
    validators[name] = method


  getSchema: (name) ->
    @schemas[name]


  validate: (schemaName, obj) ->
    @errors = undefined
    schema = @schemas[schemaName]
    @errors = if schema?
      @__validate(schema, obj).errors
    else
      ["missing schema #{ schemaName }"]

    return not @errors?


  # Recursive validate
  # Used to travel the input object recursively.
  # For internal use only.
  __validate: (schemaObj, obj) ->
    parentValidator = schemaObj['__validator']
    errors = new ValidationErrors()
    errors.record(parentValidator.validate(obj), parentValidator)

    for key, value of obj
      if schemaObj[key]?
        propertyValidator = schemaObj[key]['__validator']
        error = propertyValidator.validate(value)
        errors.record(error, propertyValidator)
        if not error? && not propertyValidator.childSchemaName? && $.type(value) == 'object'
          errors.join(@__validate(schemaObj[key], value))
      else
        errors.record(parentValidator.validateMissingProperty(key, value), parentValidator)

    errors


  parseConfigObj: (obj, parentValidator, schemaName) ->
    parentValidator ?= new PropertyValidator(inputString: 'object', schemaName: schemaName, validator: this)

    for key, value of obj
      continue if @addParentValidator(parentValidator, key, value)

      valueType = $.type(value)
      if valueType == 'string'
        propValidator = new PropertyValidator(inputString: value, property: key, parent: parentValidator, validator: this)
        obj[key] = { '__validator': propValidator }
      else if valueType == 'object'
        propValidator = new PropertyValidator(inputString: 'object', property: key, parent: parentValidator, validator: this)
        obj[key] = @parseConfigObj(value, propValidator)

    obj['__validator'] = parentValidator
    obj


  addParentValidator: (parentValidator, key, value) ->
    if key == '__validate'
      parentValidator.addValidations(value)
      return true
    else if key == '__additionalProperty'
      if $.type(value) == 'function'
        parentValidator.validateMissingProperty = ->
          isValid = value.apply(this, arguments)
          if isValid == true
            return undefined
          else
            return 'additional property check failed'
      return true
    else
      return false


# Property Validator
# ------------------

class PropertyValidator
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




