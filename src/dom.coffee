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

    {}


  dropTarget: (node, { top, left }) ->
    node = @getElementNode(node)

    while node && node.nodeType == 1 # Node.ELEMENT_NODE == 1
      if node.hasAttribute(docAttr.container)
        containerName = node.getAttribute(docAttr.container)
        if not sectionRegex.test(node.className)
          insertSnippet = @getPositionInContainer($(node), { top, left })
          if insertSnippet
            coords = @getInsertPosition(insertSnippet.$elem[0], insertSnippet.position)
            return { snippet: insertSnippet.snippet, position: insertSnippet.position, coords }
          else
            snippet = @parentSnippet(node)
            return { containerName: containerName, parent: snippet, node: node }

      else if snippetRegex.test(node.className)
        pos = @getPositionInSnippet($(node), { top, left })
        snippet = @getSnippet(node)
        coords = @getInsertPosition(node, pos.position)
        return { snippet: snippet, position: pos.position, coords }

      else if sectionRegex.test(node.className)
        return { root: true }

      node = node.parentNode

    {}


  getInsertPosition: (elem, position) ->
    rect = @getBoundingClientRect(elem)
    if position == 'before'
      { top: rect.top, left: rect.left, width: rect.width }
    else
      { top: rect.bottom, left: rect.left, width: rect.width }


  # figure out if we should insert before or after snippet
  # based on the cursor position
  getPositionInSnippet: ($elem, { top, left }) ->
    elemTop = $elem.offset().top
    elemHeight = $elem.outerHeight()
    elemBottom = elemTop + elemHeight

    if @distance(top, elemTop) < @distance(top, elemBottom)
      { position: 'before' }
    else
      { position: 'after' }


  # figure out if the user wanted to insert between snippets
  # instead of appending to the container
  # (this can be the case if the drop occurs on a margin)
  getPositionInContainer: ($container, { top, left }) ->
    $snippets = $container.find(".#{ docClass.snippet }")
    closest = undefined
    insertSnippet = undefined

    $snippets.each (index, elem) =>
      $elem = $(elem)
      elemTop = $elem.offset().top
      elemHeight = $elem.outerHeight()
      elemBottom = elemTop + elemHeight

      if not closest or @distance(top, elemTop) < closest
        closest = @distance(top, elemTop)
        insertSnippet = { $elem, position: 'before'}
      if not closest or @distance(top, elemBottom) < closest
        closest = @distance(top, elemBottom)
        insertSnippet = { $elem, position: 'after'}

      if insertSnippet
        insertSnippet.snippet = @getSnippet(insertSnippet.$elem[0])

    insertSnippet


  distance: (a, b) ->
    if a > b then a-b else b-a


  # force all containers of a snippet to be as high as they can be
  # sets css style height
  maximizeContainerHeight: (snippet) ->
    for name, elem of snippet.snippetHtml.containers
      $elem = $(elem)
      continue if $elem.hasClass(docClass.maximizedContainer)
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


  getBoundingClientRect: (node) ->
    coords = node.getBoundingClientRect()

    # code from mdn: https://developer.mozilla.org/en-US/docs/Web/API/window.scrollX
    scrollX = if (window.pageXOffset != undefined) then window.pageXOffset else (document.documentElement || window.document.body.parentNode || window.document.body).scrollLeft
    scrollY = if (window.pageYOffset != undefined) then window.pageYOffset else (document.documentElement || window.document.body.parentNode || window.document.body).scrollTop

    # translate into absolute positions
    coords =
      top: coords.top + scrollY
      bottom: coords.bottom + scrollY
      left: coords.left + scrollX
      right: coords.right + scrollX

    coords.height = coords.bottom - coords.top
    coords.width = coords.right - coords.left

    coords


