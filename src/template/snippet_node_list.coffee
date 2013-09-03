# A list of all directives of a template
# Every node with an doc- attribute will be stored by its type
class SnippetNodeList

  constructor: (@all={}) ->
    @length = 0


  add: (node) ->
    @assertNodeNameNotUsed(node)

    # create pseudo array
    this[@length] = node
    @length += 1

    # index by name
    @all[node.name] = node

    # index by type
    # node.type is one of those 'container', 'editable', 'image'
    this[node.type] ||= []
    this[node.type].push(node)


  get: (name) ->
    @all[name]


  count: (type) ->
    if type
      this[type]?.length
    else
      @length


  # @api private
  assertNodeNameNotUsed: (node) ->
    if @all[node.name]
      log.error(
        """
        #{node.type} Template parsing error: #{ docAttr[node.type] }="#{ node.name }".
        "#{ node.name }" is a duplicate name.
        """
      )

