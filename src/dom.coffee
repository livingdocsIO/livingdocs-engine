dom = do ->
  snippetClass = docClass.snippet
  snippetRegex = new RegExp("(?: |^)#{ snippetClass }(?: |$)")

  # Find the snippet this node is contained within.
  # Snippets are marked by class.
  parentSnippet: (node) ->
    node = node[0] if node.jquery

    while(node)
      if snippetRegex.test(node.className)
        snippet = @getSnippet(node)
        return snippet

      node = node.parentNode

    return undefined


  findInSnippet: () ->
    #todo


  # Snippets store a reference of themselves in their Dom node
  # consider: store reference directly without jQuery
  getSnippet: (node) ->
    $(node).data("snippet")

