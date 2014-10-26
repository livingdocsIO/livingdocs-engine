ValidationErrors = require('./validation_errors')
PropertyValidator = require('./property_validator')
validators = require('./validators')


module.exports = class Scheme
  jsVariableName = /^[a-zA-Z]\w*$/

  constructor: ->
    @validators = Object.create(validators)
    @schemas = {}


  add: (name, schema) ->
    if $.type(schema) == 'function'
      @validators[name] = schema
    else
      @addSchema(name, @parseConfigObj(schema, undefined, name))


  addSchema: (name, schema) ->
    if @validators[name]?
      throw new Error("A validator is alredy registered under this name: #{ name }")

    @schemas[name] = schema
    @validators[name] = (value) =>
      message = @__validate(schema, value).errors?[0]
      return if message? then message else true


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
        errors.record(parentValidator.validateOtherProperty(key, value), parentValidator)

    errors


  parseConfigObj: (obj, parentValidator, schemaName) ->
    parentValidator ?= new PropertyValidator(inputString: 'object', schemaName: schemaName, scheme: this)

    for key, value of obj
      continue if @addParentValidator(parentValidator, key, value)

      valueType = $.type(value)
      if valueType == 'string'
        propValidator = new PropertyValidator(inputString: value, property: key, parent: parentValidator, scheme: this)
        obj[key] = { '__validator': propValidator }
      else if valueType == 'object'
        propValidator = new PropertyValidator(inputString: 'object', property: key, parent: parentValidator, scheme: this)
        obj[key] = @parseConfigObj(value, propValidator)

    obj['__validator'] = parentValidator
    obj


  addParentValidator: (parentValidator, key, validator) ->
    switch key
      when '__validate'
        parentValidator.addValidations(validator)
      when '__additionalProperty'
        if $.type(validator) == 'function'
          parentValidator.otherPropertyValidator = validator
      else
        return false

    return true


  writeProperty: (value) ->
    if jsVariableName.test(value) then ".#{ value }" else "['#{ value }']"

