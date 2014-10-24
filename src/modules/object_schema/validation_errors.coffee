module.exports = class ValidationErrors

  # Add an error message
  # @param { String or falsy } Error message. If falsy nothing is added.
  # @param { PropertyValidator instance } The property validator that got the error
  record: (error, propertyValidator) ->
    return unless error

    if propertyValidator? and propertyValidator.location
      error = "#{ propertyValidator.location }#{ if error.indexOf('[') == 0 then '' else ': ' }#{ error }"
    @errors ?= []
    @errors.push(error)


  # Append the errors from another ValidationErrors instance
  # @param { ValidationErrors instance }
  join: ({ errors }) ->
    return unless errors?
    if @errors?
      @errors.push.apply(errors, errors)
    else
      @errors = errors
