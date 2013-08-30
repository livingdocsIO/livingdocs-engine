# Snippet node Iterator
# ---------------------
# Code is ported from rangy NodeIterator and adapted for snippets so it
# does not traverse into containers.
# Use to traverse all element nodes of a snippet but not any appended
# snippets.
class SnippetNodeIterator

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

