ValidationErrors = require('./validation_errors')
PropertyValidator = require('./property_validator')
validators = require('./validators')


module.exports = class ValidObj
  jsVariableName = /^[a-zA-Z]\w*$/

  constructor: ->
    @schemas = {}


  add: (name, schema) ->
    @schemas[name] = @parseConfigObj(schema, undefined, name)


  addValidator: (name, method) ->
    validators[name] = method


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


  addParentValidator: (parentValidator, key, validator) ->
    if key == '__validate'
      parentValidator.addValidations(validator)
      return true
    else if key == '__additionalProperty'
      if $.type(validator) == 'function'
        _that = this
        parentValidator.validateMissingProperty = (key, value) ->
          _that.errors = undefined
          isValid = validator.call(this, key, value)
          return undefined if isValid == true
          if _that.errors?
            message = _that.errors[0]
            res = /[\[.].*:.*/.exec(message)
            if res?
              return "#{ _that.writeProperty(key) }#{ res[0] }"
            else
              return "#{ _that.writeProperty(key) }: #{ message }"
          else
            return "#{ _that.writeProperty(key) }: additional property check failed"
      return true
    else
      return false


  writeProperty: (value) ->
    if jsVariableName.test(value)
      ".#{ value }"
    else
      "['#{ value }']"
