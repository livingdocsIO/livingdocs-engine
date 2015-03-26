config = require('../configuration/config')
directiveFinder = require('./directive_finder')

# Directive Iterator
# ---------------------
# Code is ported from rangy NodeIterator and adapted for component templates
# so it does not traverse into containers.
#
# Use to traverse all nodes of a template. The iterator does not go into
# containers and is safe to use even if there is content in these containers.
module.exports = class DirectiveIterator

  constructor: (root) ->
    @root = @_next = root


  current: null


  next: ->
    n = @current = @_next
    child = next = undefined
    if @current
      child = n.firstChild
      if child && n.nodeType == 1 && not @skipChildren(n)
        @_next = child
      else
        next = null
        while (n != @root) && !(next = n.nextSibling)
          n = n.parentNode

        @_next = next

    @current


  # Skip the children of directives that overwrite their content
  # like containers or editables.
  skipChildren: (elem) ->
    skipChildren = false
    directiveFinder.eachDirective elem, (type, name) ->
      if config.directives[type].overwritesContent
        skipChildren = true

    skipChildren


  # only iterate over element nodes (Node.ELEMENT_NODE == 1)
  nextElement: ->
    while @next()
      skipChildren = false # only skip the children the first time around
      break if @current.nodeType == 1

    @current


  detach: ->
    @current = @root = null

