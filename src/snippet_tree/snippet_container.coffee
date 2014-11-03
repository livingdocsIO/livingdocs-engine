assert = require('../modules/logging/assert')

# SnippetContainer
# ----------------
# A SnippetContainer contains and manages a linked list
# of snippets.
#
# The snippetContainer is responsible for keeping its componentTree
# informed about changes (only if they are attached to one).
#
# @prop first: first snippet in the container
# @prop last: last snippet in the container
# @prop parentSnippet: parent ComponentModel
module.exports = class SnippetContainer


  constructor: ({ @parentSnippet, @name, isRoot }) ->
    @isRoot = isRoot?
    @first = @last = undefined


  prepend: (snippet) ->
    if @first
      @insertBefore(@first, snippet)
    else
      @attachSnippet(snippet)

    this


  append: (snippet) ->
    if @parentSnippet
      assert snippet isnt @parentSnippet, 'cannot append snippet to itself'

    if @last
      @insertAfter(@last, snippet)
    else
      @attachSnippet(snippet)

    this


  insertBefore: (snippet, insertedSnippet) ->
    return if snippet.previous == insertedSnippet
    assert snippet isnt insertedSnippet, 'cannot insert snippet before itself'

    position =
      previous: snippet.previous
      next: snippet
      parentContainer: snippet.parentContainer

    @attachSnippet(insertedSnippet, position)


  insertAfter: (snippet, insertedSnippet) ->
    return if snippet.next == insertedSnippet
    assert snippet isnt insertedSnippet, 'cannot insert snippet after itself'

    position =
      previous: snippet
      next: snippet.next
      parentContainer: snippet.parentContainer

    @attachSnippet(insertedSnippet, position)


  up: (snippet) ->
    if snippet.previous?
      @insertBefore(snippet.previous, snippet)


  down: (snippet) ->
    if snippet.next?
      @insertAfter(snippet.next, snippet)


  getComponentTree: ->
    @componentTree || @parentSnippet?.componentTree


  # Traverse all snippets
  each: (callback) ->
    snippet = @first
    while (snippet)
      snippet.descendantsAndSelf(callback)
      snippet = snippet.next


  eachContainer: (callback) ->
    callback(this)
    @each (snippet) ->
      for name, snippetContainer of snippet.containers
        callback(snippetContainer)


  # Traverse all snippets and containers
  all: (callback) ->
    callback(this)
    @each (snippet) ->
      callback(snippet)
      for name, snippetContainer of snippet.containers
        callback(snippetContainer)


  remove: (snippet) ->
    snippet.destroy()
    @_detachSnippet(snippet)


  # Private
  # -------

  # Every snippet added or moved most come through here.
  # Notifies the componentTree if the parent snippet is
  # attached to one.
  # @api private
  attachSnippet: (snippet, position = {}) ->
    func = =>
      @link(snippet, position)

    if componentTree = @getComponentTree()
      componentTree.attachingSnippet(snippet, func)
    else
      func()


  # Every snippet that is removed must come through here.
  # Notifies the componentTree if the parent snippet is
  # attached to one.
  # Snippets that are moved inside a componentTree should not
  # call _detachSnippet since we don't want to fire
  # SnippetRemoved events on the snippet tree, in these
  # cases unlink can be used
  # @api private
  _detachSnippet: (snippet) ->
    func = =>
      @unlink(snippet)

    if componentTree = @getComponentTree()
      componentTree.detachingSnippet(snippet, func)
    else
      func()


  # @api private
  link: (snippet, position) ->
    @unlink(snippet) if snippet.parentContainer

    position.parentContainer ||= this
    @setSnippetPosition(snippet, position)


  # @api private
  unlink: (snippet) ->
    container = snippet.parentContainer
    if container

      # update parentContainer links
      container.first = snippet.next unless snippet.previous?
      container.last = snippet.previous unless snippet.next?

      # update previous and next nodes
      snippet.next?.previous = snippet.previous
      snippet.previous?.next = snippet.next

      @setSnippetPosition(snippet, {})


  # @api private
  setSnippetPosition: (snippet, { parentContainer, previous, next }) ->
    snippet.parentContainer = parentContainer
    snippet.previous = previous
    snippet.next = next

    if parentContainer
      previous.next = snippet if previous
      next.previous = snippet if next
      parentContainer.first = snippet unless snippet.previous?
      parentContainer.last = snippet unless snippet.next?


