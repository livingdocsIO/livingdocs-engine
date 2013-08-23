# A list of all directives of a template
# Every node with an doc- attribute will be stored by its type
class SnippetNodeList


  constructor: (@all={}) ->


  add: (node) ->
    @assertNodeNameNotUsed(node)

    @all[node.name] = node
    this[node.type] ||= []
    this[node.type].push(node)

    # node.type
    # 'container', 'editable', 'image'

    # if node.type == 'container'
    #   log node.name
    #   @containers ||= {}
    #   @containers[node.name] = node

    # this[node.type] ||= {}
    # this[node.type][node.name] = node.elem
    # @count[node.type] = if @count[node.type] then @count[node.type] + 1 else 1


  get: (name) ->
    @all[name]

  # deprecated
  count: (type) ->
    this[type]?.length


  length: (type) ->
    this[type]?.length


  # @api private
  assertNodeNameNotUsed: (node) ->
    if @all[node.name]
      log.error(
        """
        #{node.type} Template parsing error: #{ docAttr[node.type] }="#{ node.name }".
        "#{ node.name }" is a duplicate name.
        """
      )

