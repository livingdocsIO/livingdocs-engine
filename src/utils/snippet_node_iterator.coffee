# Snippet node Iterator
# ---------------------
# Code is ported from rangy NodeIterator and adapted for snippets so it
# does not traverse into containers.
# Use to traverse all element nodes of a snippet but not any appended
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
    if (@current)
      if n.nodeType == 1 && !n.hasAttribute(docAttr.container) && child = n.firstChild
        @_next = child
      else
        next = null
        while ((n != this.root) && !(next = n.nextSibling))
          n = n.parentNode;

        this._next = next;

    @current


  detach: () ->
    @current = @_next = @root = null

