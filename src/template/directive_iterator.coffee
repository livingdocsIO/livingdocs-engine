# Directive Iterator
# ---------------------
# Code is ported from rangy NodeIterator and adapted for snippet templates
# so it does not traverse into containers.
#
# Use to traverse all nodes of a template. The iterator does not go into
# containers and is safe to use even if there is content in these containers.
class DirectiveIterator

  constructor: (root) ->
    @root = @_next = root


  current: null


  hasNext: ->
    !!@_next


  next: () ->
    n = @current = @_next
    child = next = undefined
    if @current
      child = n.firstChild
      if child && n.nodeType == 1 && !n.hasAttribute(docAttr.container)
        @_next = child
      else
        next = null
        while (n != @root) && !(next = n.nextSibling)
          n = n.parentNode

        @_next = next

    @current


  # only iterate over element nodes (Node.ELEMENT_NODE == 1)
  nextElement: () ->
    while @next()
      break if @current.nodeType == 1

    @current


  detach: () ->
    @current = @_next = @root = null

