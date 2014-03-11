config = require('../configuration/defaults')
docClass = config.html.css

# DOM helper methods
# ------------------
# Methods to parse and update the Dom tree in accordance to
# the SnippetTree and Livingdocs classes and attributes
module.exports = do ->
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
      # above container
      if node.hasAttribute(containerAttr)
        closestSnippet = @getClosestSnippet(node, { top, left })
        return @getTargetInContainer(closestSnippet, node)

      # above snippet
      else if snippetRegex.test(node.className)
        return @getSnippetTarget(node, { top, left })

      # above root container
      else if sectionRegex.test(node.className)
        snippetTree = $(node).data('snippetTree')
        return obj =
          target: 'root'
          node: node
          snippetTree: snippetTree

      node = node.parentNode


  getTargetInContainer: (closestSnippetData, node) ->
    if closestSnippetData?
      snippetView = @getSnippetView(closestSnippetData.$elem[0])

      target: 'snippet'
      snippetView: snippetView
      position: closestSnippetData.position
    else
      containerAttr = config.directives.container.renderedAttr
      containerName = node.getAttribute(containerAttr)

      target: 'container'
      node: node
      snippetView: @getSnippetView(node)
      containerName: containerName


  getSnippetTarget: (elem, topLeft) ->
    target: 'snippet'
    snippetView: @getSnippetView(elem)
    position: @getPositionOnSnippet(elem, topLeft)


  # Figure out if we should insert before or after a snippet
  # based on the cursor position.
  getPositionOnSnippet: (elem, { top, left }) ->
    $elem = $(elem)
    elemTop = $elem.offset().top
    elemHeight = $elem.outerHeight()
    elemBottom = elemTop + elemHeight

    if @distance(top, elemTop) < @distance(top, elemBottom)
      'before'
    else
      'after'


  # Get the closest snippet in a container for a top left position
  getClosestSnippet: (container, { top, left }) ->
    $snippets = $(container).find(".#{ docClass.snippet }")
    closest = undefined
    closestSnippet = undefined

    $snippets.each (index, elem) =>
      $elem = $(elem)
      elemTop = $elem.offset().top
      elemHeight = $elem.outerHeight()
      elemBottom = elemTop + elemHeight

      if not closest? || @distance(top, elemTop) < closest
        closest = @distance(top, elemTop)
        closestSnippet = { $elem, position: 'before'}
      if not closest? || @distance(top, elemBottom) < closest
        closest = @distance(top, elemBottom)
        closestSnippet = { $elem, position: 'after'}

    closestSnippet


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


  # GetBoundingClientRect with top and left relative to the document
  # (ideal for absolute positioned elements)
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


