# DOM helper methods
# ------------------
# Methods to parse and update the Dom tree in accordance to
# the SnippetTree and Livingdocs classes and attributes
dom = do ->
  snippetRegex = new RegExp("(?: |^)#{ docClass.snippet }(?: |$)")
  sectionRegex = new RegExp("(?: |^)#{ docClass.section }(?: |$)")

  # Find the snippet this node is contained within.
  # Snippets are marked by a class at the moment.
  findSnippetView: (node) ->
    node = @getElementNode(node)

    while node && node.nodeType == 1 # Node.ELEMENT_NODE == 1
      if snippetRegex.test(node.className)
        view = @getSnippetView(node)
        return view

      node = node.parentNode

    return undefined


  findNodeContext: (node) ->
    node = @getElementNode(node)

    while node && node.nodeType == 1 # Node.ELEMENT_NODE == 1
      nodeContext = @getNodeContext(node)
      return nodeContext if nodeContext

      node = node.parentNode

    return undefined


  getNodeContext: (node) ->
    for directiveType, obj of config.directives
      continue if not obj.elementDirective

      directiveAttr = obj.renderedAttr
      if node.hasAttribute(directiveAttr)
        return {
          contextAttr: directiveAttr
          attrName: node.getAttribute(directiveAttr)
        }

    return undefined


  # Find the container this node is contained within.
  findContainer: (node) ->
    node = @getElementNode(node)
    containerAttr = config.directives.container.renderedAttr

    while node && node.nodeType == 1 # Node.ELEMENT_NODE == 1
      if node.hasAttribute(containerAttr)
        containerName = node.getAttribute(containerAttr)
        if not sectionRegex.test(node.className)
          view = @findSnippetView(node)

        return {
          node: node
          containerName: containerName
          snippetView: view
        }

      node = node.parentNode

    {}


  getImageName: (node) ->
    imageAttr = config.directives.image.renderedAttr
    if node.hasAttribute(imageAttr)
      imageName = node.getAttribute(imageAttr)
      return imageName


  getHtmlElementName: (node) ->
    htmlAttr = config.directives.html.renderedAttr
    if node.hasAttribute(htmlAttr)
      htmlElementName = node.getAttribute(htmlAttr)
      return htmlElementName


  getEditableName: (node) ->
    editableAttr = config.directives.editable.renderedAttr
    if node.hasAttribute(editableAttr)
      imageName = node.getAttribute(editableAttr)
      return editableName



  dropTarget: (node, { top, left }) ->
    node = @getElementNode(node)
    containerAttr = config.directives.container.renderedAttr

    while node && node.nodeType == 1 # Node.ELEMENT_NODE == 1
      if node.hasAttribute(containerAttr)
        containerName = node.getAttribute(containerAttr)
        if not sectionRegex.test(node.className)
          insertSnippet = @getPositionInContainer($(node), { top, left })
          if insertSnippet
            coords = @getInsertPosition(insertSnippet.$elem[0], insertSnippet.position)
            return { snippetView: insertSnippet.snippetView, position: insertSnippet.position, coords }
          else
            view = @findSnippetView(node)
            return { containerName: containerName, parent: view, node: node }

      else if snippetRegex.test(node.className)
        pos = @getPositionInSnippet($(node), { top, left })
        view = @getSnippetView(node)
        coords = @getInsertPosition(node, pos.position)
        return { snippetView: view, position: pos.position, coords }

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


  # figure out if the user wanted to insert between snippets
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
        insertSnippet.snippetView = @getSnippetView(insertSnippet.$elem[0])

    insertSnippet


  distance: (a, b) ->
    if a > b then a-b else b-a


  # force all containers of a snippet to be as high as they can be
  # sets css style height
  maximizeContainerHeight: (view) ->
    if view.template.containerCount > 1
      for name, elem of view.containers
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
  getSnippetView: (node) ->
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


