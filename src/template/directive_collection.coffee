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


  count: (type) ->
    if type
      this[type]?.length
    else
      @length


  each: (callback) ->
    for directive in this
      callback(directive)


  # @api private
  assertNameNotUsed: (directive) ->
    assert not @all[directive.name],
      """
      #{directive.type} Template parsing error:
      #{ docAttr[directive.type] }="#{ directive.name }".
      "#{ directive.name }" is a duplicate name.
      """
