# DOM helper methods
# ------------------
# Methods to parse and update the Dom tree in accordance to
# the SnippetTree and Livingdocs classes and attributes
dom = do ->
  snippetClass = docClass.snippet
  snippetRegex = new RegExp("(?: |^)#{ snippetClass }(?: |$)")

  # Find the snippet this node is contained within.
  # Snippets are marked by a class at the moment.
  parentSnippet: (node) ->
    node = node[0] if node.jquery

    while node
      if snippetRegex.test(node.className)
        snippet = @getSnippet(node)
        return snippet

      node = node.parentNode

    return undefined


  # Snippets store a reference of themselves in their Dom node
  # consider: store reference directly without jQuery
  getSnippet: (node) ->
    $(node).data('snippet')
