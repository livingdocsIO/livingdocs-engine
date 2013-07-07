class SnippetNodeList


  constructor: (@all={}) ->
    @count = {}

  add: (node) ->
    @assertNodeNameNotUsed(node.name)

    @all[node.name] = node

    this[node.type] ||= {}
    this[node.type][node.name] = node.htmlNode

    @count[node.type] = if @count[node.type] then @count[node.type] + 1 else 1




  # @private
  assertNodeNameNotUsed: (name) ->
    if @all[name]
      log.error(
        """
        A node with the name "#{name}" was already added.
        Each node in a snippet requires a unique name, regardless of type.
        """
      )
