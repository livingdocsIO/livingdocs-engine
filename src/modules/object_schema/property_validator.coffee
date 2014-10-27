# Property Validator
# ------------------

module.exports = class PropertyValidator
  termRegex = /\w[\w ]*\w/g

  constructor: ({ @inputString, @property, @schemaName, @parent, @scheme }) ->
    @validators = []
    @location = @getLocation()
    @parent.addRequiredProperty(@property) if @parent?
    @addValidations(@inputString)


  getLocation: ->
    if not @property?
      ''
    else if @parent?
      @parent.location + @scheme.writeProperty(@property)
    else
      @scheme.writeProperty(@property)


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


  validate: (value, errors) ->
    isValid = true
    validators = @scheme.validators
    for name in @validators || []
      validate = validators[name]
      return errors.add("missing validator #{ name }", location: @location) unless validate?

      continue if valid = validate(value) == true
      errors.add(valid, location: @location, defaultMessage: "#{ name } validator failed")
      isValid = false

    return false if not isValid = @validateArray(value, errors)
    return false if not isValid = @validateRequiredProperties(value, errors)

    isValid


  validateArray: (arr, errors) ->
    return true unless @arrayValidator?
    isValid = true

    validate = @scheme.validators[@arrayValidator]
    return errors.add("missing validator #{ @arrayValidator }", location: @location) unless validate?

    for entry, index in arr || []
      res = validate(entry)
      continue if res == true
      location = "#{ @location }[#{ index }]"
      errors.add(res, location: location, defaultMessage: "#{ name } validator failed")
      isValid = false

    isValid


  validateOtherProperty: (key, value, errors) ->
    return true unless @otherPropertyValidator?
    @scheme.errors = undefined
    return true if isValid = @otherPropertyValidator.call(this, key, value)

    if @scheme.errors?
      errors.join(@scheme.errors, location: "#{ @location }#{ @scheme.writeProperty(key) }")
    else
      errors.add("additional property check failed", location: "#{ @location }#{ @scheme.writeProperty(key) }")

    false


  validateRequiredProperties: (obj, errors) ->
    isValid = true
    for key, isRequired of @requiredProperties
      if not obj[key]? && isRequired
        errors.add("required property missing", location: "#{ @location }#{ @scheme.writeProperty(key) }")
        isValid = false

    isValid


  addRequiredProperty: (key) ->
    @requiredProperties ?= {}
    @requiredProperties[key] = true


  removeRequiredProperty: (key) ->
    @requiredProperties[key] = undefined

