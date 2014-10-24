module.exports = class ValidationErrors

  record: (error, propertyValidator) ->
    return unless error

    if propertyValidator? and propertyValidator.location
      error = "#{ propertyValidator.location }: #{ error }"
    @errors ?= []
    @errors.push(error)


  # Join another ValidationErrors object
  join: ({ errors }) ->
    return unless errors?
    if @errors?
      @errors.push.apply(errors, errors)
    else
      @errors = errors
