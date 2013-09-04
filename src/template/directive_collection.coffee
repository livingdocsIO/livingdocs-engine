# A list of all directives of a template
# Every node with an doc- attribute will be stored by its type
class DirectiveCollection

  constructor: (@all={}) ->
    @length = 0


  add: (directive) ->
    @assertNameNotUsed(directive)

    # create pseudo array
    this[@length] = directive
    @length += 1

    # index by name
    @all[directive.name] = directive

    # index by type
    # directive.type is one of those 'container', 'editable', 'image'
    this[directive.type] ||= []
    this[directive.type].push(directive)


  get: (name) ->
    @all[name]


  count: (type) ->
    if type
      this[type]?.length
    else
      @length


  # @api private
  assertNameNotUsed: (node) ->
    if @all[node.name]
      log.error(
        """
        #{node.type} Template parsing error: #{ docAttr[node.type] }="#{ node.name }".
        "#{ node.name }" is a duplicate name.
        """
      )

