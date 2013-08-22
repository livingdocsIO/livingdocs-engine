class SnippetNodeList


  constructor: (@all={}) ->
    @count = {}

  add: (node) ->
    @assertNodeNameNotUsed(node)

    @all[node.name] = node

    this[node.type] ||= {}
    this[node.type][node.name] = node.htmlNode

    @count[node.type] = if @count[node.type] then @count[node.type] + 1 else 1


  # @api private
  assertNodeNameNotUsed: (node) ->
    if @all[node.name]
      log.error(
        """
        #{node.type} Template parsing error: #{ docAttr[node.type] }="#{ node.name }".
        "#{ node.name }" is a duplicate name.
        """
      )
