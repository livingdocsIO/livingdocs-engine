config = require('../configuration/config')
css = config.css

# DOM helper methods
# ------------------
# Methods to parse and update the Dom tree in accordance to
# the ComponentTree and Livingdocs classes and attributes
module.exports = do ->
  componentRegex = new RegExp("(?: |^)#{ css.component }(?: |$)")
  sectionRegex = new RegExp("(?: |^)#{ css.section }(?: |$)")

  # Find the component this node is contained within.
  # Components are marked by a class at the moment.
  findComponentView: (node) ->
    node = @getElementNode(node)

    while node && node.nodeType == 1 # Node.ELEMENT_NODE == 1
      if componentRegex.test(node.className)
        view = @getComponentView(node)
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
          view = @findComponentView(node)

        return {
          node: node
          containerName: containerName
          componentView: view
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
        closestComponentData = @getClosestComponent(node, { top, left })
        if closestComponentData?
          return @getClosestComponentTarget(closestComponentData)
        else
          return @getContainerTarget(node)

      # above component
      else if componentRegex.test(node.className)
        return @getComponentTarget(node, { top, left })

      # above root container
      else if sectionRegex.test(node.className)
        closestComponentData = @getClosestComponent(node, { top, left })
        if closestComponentData?
          return @getClosestComponentTarget(closestComponentData)
        else
          return @getRootTarget(node)

      node = node.parentNode


  getComponentTarget: (elem, { top, left, position }) ->
    target: 'snippet'
    componentView: @getComponentView(elem)
    position: position || @getPositionOnComponent(elem, { top, left })


  getClosestComponentTarget: (closestComponentData) ->
    elem = closestComponentData.$elem[0]
    position = closestComponentData.position
    @getComponentTarget(elem, { position })


  getContainerTarget: (node) ->
    containerAttr = config.directives.container.renderedAttr
    containerName = node.getAttribute(containerAttr)

    target: 'container'
    node: node
    componentView: @findComponentView(node)
    containerName: containerName


  getRootTarget: (node) ->
    componentTree = $(node).data('componentTree')

    target: 'root'
    node: node
    componentTree: componentTree


  # Figure out if we should insert before or after a component
  # based on the cursor position.
  getPositionOnComponent: (elem, { top, left }) ->
    $elem = $(elem)
    elemTop = $elem.offset().top
    elemHeight = $elem.outerHeight()
    elemBottom = elemTop + elemHeight

    if @distance(top, elemTop) < @distance(top, elemBottom)
      'before'
    else
      'after'


  # Get the closest component in a container for a top left position
  getClosestComponent: (container, { top, left }) ->
    $components = $(container).find(".#{ css.component }")
    closest = undefined
    closestComponent = undefined

    $components.each (index, elem) =>
      $elem = $(elem)
      elemTop = $elem.offset().top
      elemHeight = $elem.outerHeight()
      elemBottom = elemTop + elemHeight

      if not closest? || @distance(top, elemTop) < closest
        closest = @distance(top, elemTop)
        closestComponent = { $elem, position: 'before'}
      if not closest? || @distance(top, elemBottom) < closest
        closest = @distance(top, elemBottom)
        closestComponent = { $elem, position: 'after'}

    closestComponent


  distance: (a, b) ->
    if a > b then a - b else b - a


  # force all containers of a component to be as high as they can be
  # sets css style height
  maximizeContainerHeight: (view) ->
    if view.template.containerCount > 1
      for name, elem of view.containers
        $elem = $(elem)
        continue if $elem.hasClass(css.maximizedContainer)
        $parent = $elem.parent()
        parentHeight = $parent.height()
        outer = $elem.outerHeight(true) - $elem.height()
        $elem.height(parentHeight - outer)
        $elem.addClass(css.maximizedContainer)


  # remove all css style height declarations added by
  # maximizeContainerHeight()
  restoreContainerHeight: () ->
    $(".#{ css.maximizedContainer }")
      .css('height', '')
      .removeClass(css.maximizedContainer)


  getElementNode: (node) ->
    if node?.jquery
      node[0]
    else if node?.nodeType == 3 # Node.TEXT_NODE == 3
      node.parentNode
    else
      node


  # Components store a reference of themselves in their Dom node
  # consider: store reference directly without jQuery
  getComponentView: (node) ->
    $(node).data('snippet')


  # GetAbsoluteBoundingClientRect with top and left relative to the document
  # (ideal for absolute positioned elements)
  getAbsoluteBoundingClientRect: (node) ->
    win = node.ownerDocument.defaultView
    { scrollX, scrollY } = @getScrollPosition(win)

    # translate into absolute positions
    coords = node.getBoundingClientRect()
    coords =
      top: coords.top + scrollY
      bottom: coords.bottom + scrollY
      left: coords.left + scrollX
      right: coords.right + scrollX

    coords.height = coords.bottom - coords.top
    coords.width = coords.right - coords.left

    coords


  getScrollPosition: (win) ->
    # code from mdn: https://developer.mozilla.org/en-US/docs/Web/API/window.scrollX
    scrollX: if (win.pageXOffset != undefined) then win.pageXOffset else (win.document.documentElement || win.document.body.parentNode || win.document.body).scrollLeft
    scrollY: if (win.pageYOffset != undefined) then win.pageYOffset else (win.document.documentElement || win.document.body.parentNode || win.document.body).scrollTop

