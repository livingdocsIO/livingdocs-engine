module.exports = class ValidationErrors


  hasErrors: ->
    @errors?


  setRoot: (@root) ->
    this


  # Add an error message
  add: (message, { location, defaultMessage }={} ) ->
    message = defaultMessage if message == false
    @errors ?= []
    if $.type(message) == 'string'
      @errors.push
        path: location
        message: message
    else if message instanceof ValidationErrors
      @join(message, location: location)
    else if message.path and message.message
      error = message
      @errors.push
        path: location + error.path
        message: error.message
    else
      throw new Error('ValidationError.add() unknown error type')

    false


  # Append the errors from another ValidationErrors instance
  # @param { ValidationErrors instance }
  join: ({ errors }, { location }={}) ->
    return unless errors?

    if errors.length
      @errors ?= []
      for error in errors
        @errors.push
          path: (location || '') + error.path
          message: error.message


  getMessages: ->
    messages = []
    for error in @errors || []
      messages.push("#{ @root || '' }#{ error.path }: #{ error.message }")

    messages
