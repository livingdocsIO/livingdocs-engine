class DesignStyle

  constructor: ({ @name, @type, value, options }) ->
    if @type isnt 'option' && @type isnt 'select'
      log.error "TemplateStyle error: unknown type '#{ @type }'"

    if @type is 'option'
      @value = value
    else if @type is 'select'
      @options = options
    else
      log.error 'TemplateStyle error: no value or options provided'


  # Get instructions which css classes to add and remove.
  # We do not control the class attribute of a snippet DOM element
  # since the UI or other scripts can mess with it any time. So the
  # instructions are designed not to interfere with other css classes
  # present in an elements class attribute.
  cssClassChanges: (name, value) ->
    if @validateValue(value)
      if @type is 'option'
        remove: if value is undefined then @value else undefined
        add: value
      else if @type is 'select'
        remove: @otherOptions(value)
        add: value
    else
      if @type is 'option'
        remove: currentValue
        add: undefined
      else if @type is 'select'
        remove: @otherOptions(undefined)
        add: undefined


  validateValue: (value) ->
    if value is undefined
      true
    else if @type is 'option'
      value == @value
    else if @type is 'select'
      @containsOption(value)
    else
      log.warn ""


  containsOption: (value) ->
    for caption, included of @options
      return true if value is included

    false


  otherOptions: (value) ->
    others = []
    for caption, other of @options
      others.push other if other isnt value

    others
