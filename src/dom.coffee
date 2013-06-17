# DOM helper methods
# ------------------
# Methods to parse and update the Dom tree in accordance to
# the SnippetTree and Livingdocs classes and attributes
dom = do ->
  snippetRegex = new RegExp("(?: |^)#{ docClass.snippet }(?: |$)")
  sectionRegex = new RegExp("(?: |^)#{ docClass.section }(?: |$)")

  # Find the snippet this node is contained within.
  # Snippets are marked by a class at the moment.
  parentSnippet: (node) ->
    node = @getElementNode(node)

    while node && node.nodeType == 1 # Node.ELEMENT_NODE == 1
      if snippetRegex.test(node.className)
        snippet = @getSnippet(node)
        return snippet

      node = node.parentNode

    return undefined


  parentContainer: (node) ->
    node = @getElementNode(node)

    while node && node.nodeType == 1 # Node.ELEMENT_NODE == 1
      if node.hasAttribute(docAttr.container)
        containerName = node.getAttribute(docAttr.container)
        if not sectionRegex.test(node.className)
          snippet = @parentSnippet(node)

        return {
          node: node
          containerName: containerName
          snippet: snippet
        }

      node = node.parentNode

    return {}


  dropTarget: (node) ->
    node = @getElementNode(node)

    while node && node.nodeType == 1 # Node.ELEMENT_NODE == 1
      if node.hasAttribute(docAttr.container)
        containerName = node.getAttribute(docAttr.container)
        if not sectionRegex.test(node.className)
          snippet = @parentSnippet(node)
        return { containerName: containerName, parent: snippet, node: node }

      else if snippetRegex.test(node.className)
        snippet = @getSnippet(node)
        return { snippet: snippet }

      else if sectionRegex.test(node.className)
        return { root: true }

      node = node.parentNode


  # force all containers of a snippet to be as high as they can be
  # sets css style height
  maximizeContainerHeight: (snippet) ->
    for name, elem of snippet.snippetHtml.containers
      $elem = $(elem)
      continue if $elem.hasClass(docClass.maximizedContainer)
      log $elem.hasClass(docClass.maximizedContainer)
      $parent = $elem.parent()
      parentHeight = $parent.height()
      outer = $elem.outerHeight(true) - $elem.height()
      $elem.height(parentHeight - outer)
      $elem.addClass(docClass.maximizedContainer)


  # remove all css style height declarations added by
  # maximizeContainerHeight()
  restoreContainerHeight: () ->
    $(".#{ docClass.maximizedContainer }")
      .css('height', '')
      .removeClass(docClass.maximizedContainer)


  getElementNode: (node) ->
    if node?.jquery
      node[0]
    else if node?.nodeType == 3 # Node.TEXT_NODE == 3
      node.parentNode
    else
      node

  # Snippets store a reference of themselves in their Dom node
  # consider: store reference directly without jQuery
  getSnippet: (node) ->
    $(node).data('snippet')
