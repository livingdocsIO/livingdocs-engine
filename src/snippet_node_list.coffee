class SnippetNodeList


  constructor: (@all={}) ->


  add: (node) ->
    @assertNodeNameNotUsed(node.name)

    @all[node.name] = node

    this[node.type] ||= {}
    this[node.type][node.name] = node


  # @private
  assertNodeNameNotUsed: (name) ->
    if @all[name]
      log.error \
        """
        A node with the name "#{name}" already was already added.
        Each node in a snippet requires a unique identifier, regardless of type.
        """
