class SnippetNodeList


  constructor: (@all={}) ->


  add: (node) ->
    @assertNodeNameNotUsed(node.name)

    @all[node.name] = node

    this[node.type] ||= {}
    this[node.type][node.name] = node.htmlNode


  # @private
  assertNodeNameNotUsed: (name) ->
    if @all[name]
      log.error(
        """
        A node with the name "#{name}" was already added.
        Each node in a snippet requires a unique name, regardless of type.
        """
      )
