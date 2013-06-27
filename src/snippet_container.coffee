# SnippetContainer
# ----------------
# A SnippetContainer contains and manages a linked list
# of snippets.
#
# The snippetContainer is responsible for keeping its snippetTree
# informed about changes (only if they are attached to one).
# 
# @prop first: first snippet in the container
# @prop last: last snippet in the container
# @prop parentSnippet: parent Snippet
class SnippetContainer


  constructor: ({ @parentSnippet, @name, isRoot }) ->
    @isRoot = isRoot?
    @first = @last = undefined


  prepend: (snippet) ->
    if @first
      @insertBefore(@first, snippet)
    else
      @first = @last = snippet
      @attachSnippet(snippet)

    this


  append: (snippet) ->
    if @parentSnippet? and snippet == @parentSnippet
      log.error('cannot append snippet to itself')

    if @last
      @insertAfter(@last, snippet)
    else
      @first = @last = snippet
      @attachSnippet(snippet)

    this


  insertBefore: (snippet, insertedSnippet) ->
    log.error('cannot insert snippet before itself') if snippet == insertedSnippet

    position =
      previous: snippet.previous
      next: snippet

    @attachSnippet(insertedSnippet, position)

    if !insertedSnippet.previous?
      @first = insertedSnippet


  insertAfter: (snippet, insertedSnippet) ->
    log.error('cannot insert snippet after itself') if snippet == insertedSnippet

    position =
      previous: snippet
      next: snippet.next

    @attachSnippet(insertedSnippet, position)

    if !insertedSnippet.next?
      @last = insertedSnippet


  up: (snippet) ->
    if snippet.previous?
      @insertBefore(snippet.previous, snippet)


  down: (snippet) ->
    if snippet.next?
      @insertAfter(snippet.next, snippet)


  getSnippetTree: ->
    @snippetTree || @parentSnippet?.snippetTree


  $html: ->
    if @parentSnippet?
      elem = @parentSnippet.snippetHtml?.containers[@name]
      $(elem)
    else if @snippetTree?
      @snippetTree.renderer.$root
    else
      $()


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


  ui: ->
    if not @uiInjector
      snippetTree = @getSnippetTree()
      snippetTree.renderer.createInterfaceInjector(this)
    @uiInjector


  # Private
  # -------

  # Every snippet added or moved most come through here.
  # Notifies the snippetTree if the parent snippet is
  # attached to one.
  # @api private
  attachSnippet: (snippet, position = {}) ->
    func = =>
      @link(snippet, position)

    if snippetTree = @getSnippetTree()
      snippetTree.attachingSnippet(snippet, func)
    else
      func()


  # Every snippet that is removed must come through here.
  # Notifies the snippetTree if the parent snippet is
  # attached to one.
  # Snippets that are moved inside a snippetTree should not
  # call _detachSnippet since we don't want to raise
  # SnippetRemoved events on the snippet tree, in these
  # cases unlink can be used
  # @api private
  _detachSnippet: (snippet) ->
    func = =>
      @unlink(snippet)

    if snippetTree = @getSnippetTree()
      snippetTree.detachingSnippet(snippet, func)
    else
      func()


  # @api private
  link: (snippet, position) ->
    if snippet.parentContainer
      @unlink(snippet)

    position.parentContainer = this
    @setSnippetPosition(snippet, position)


  # @api private
  unlink: (snippet) ->
    container = snippet.parentContainer
    if container

      # update parentContainer links
      container.first = snippet.next unless snippet.previous?
      container.last = snippet.previous unless snippet.next?

      # update previous and next nodes
      snippet.next?.previous = snippet.previous
      snippet.previous?.next = snippet.next

      @setSnippetPosition(snippet, {})


  # @api private
  setSnippetPosition: (snippet, { parentContainer, previous, next }) ->
    previous.next = snippet if previous
    next.previous = snippet if next

    snippet.parentContainer = parentContainer
    snippet.previous = previous
    snippet.next = next


