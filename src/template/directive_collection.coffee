# A list of all directives of a template
# Every node with an doc- attribute will be stored by its type
class DirectiveCollection

  constructor: (@all={}) ->
    @length = 0


  add: (directive) ->
    @assertNameNotUsed(directive)

    # create pseudo array
    this[@length] = directive
    directive.index = @length
    @length += 1

    # index by name
    @all[directive.name] = directive

    # index by type
    # directive.type is one of those 'container', 'editable', 'image', 'html'
    this[directive.type] ||= []
    this[directive.type].push(directive)


  next: (name) ->
    directive = name if name instanceof Directive
    directive ||= @all[name]
    this[directive.index += 1]


  nextOfType: (name) ->
    directive = name if name instanceof Directive
    directive ||= @all[name]

    requiredType = directive.type
    while directive = @next(directive)
      return directive if directive.type is requiredType


  get: (name) ->
    @all[name]


  # helper to directly get element wrapped in a jQuery object
  $getElem: (name) ->
    $(@all[name].elem)


  count: (type) ->
    if type
      this[type]?.length
    else
      @length


  each: (callback) ->
    for directive in this
      callback(directive)


  clone: ->
    newCollection = new DirectiveCollection()
    @each (directive) ->
      newCollection.add(directive.clone())

    newCollection


  assertAllLinked: ->
    @each (directive) ->
      return false if not directive.elem

    return true


  # @api private
  assertNameNotUsed: (directive) ->
    assert directive && not @all[directive.name],
      """
      #{directive.type} Template parsing error:
      #{ config.directives[directive.type].renderedAttr }="#{ directive.name }".
      "#{ directive.name }" is a duplicate name.
      """
