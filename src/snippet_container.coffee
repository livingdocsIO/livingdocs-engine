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

  constructor: ({ @parentSnippet, @$domNode, @name, @snippetTree, root }) ->
    @root = root?
    @first = @last = undefined


  # insert snippet at the beginning
  prepend: (snippet) ->
    if @first
      @insertBefore(@first, snippet)
    else
      @first = @last = snippet
      @_attachSnippet(snippet)

    @ #chaining


  # insert snippet at the end
  append: (snippet) ->
    if @last
      @insertAfter(@last, snippet)
    else
      @first = @last = snippet
      @_attachSnippet(snippet)

    @ #chaining


  insertBefore: (snippet, insertedSnippet) ->
    position =
      previous: snippet.previous
      next: snippet

    snippet.previous = insertedSnippet
    @_attachSnippet(insertedSnippet, position)

    if !insertedSnippet.previous?
      @first = insertedSnippet


  insertAfter: (snippet, insertedSnippet) ->
    position =
      previous: snippet
      next: snippet.next

    snippet.next = insertedSnippet
    @_attachSnippet(insertedSnippet, position)

    if !insertedSnippet.next?
      @last = insertedSnippet


  up: (snippet) ->
    if snippet.previous?
      @insertBefore(snippet.previous, snippet)


  down: (snippet) ->
    if snippet.next?
      @insertAfter(snippet.next, snippet)


  getSnippetTree: () ->
    @snippetTree || @parentSnippet.snippetTree


  each: (callback) ->
    snippet = @first
    while (snippet)
      snippet.descendantsAndSelf(callback)
      snippet = snippet.next


  remove: (snippet) ->
    @_detachSnippet(snippet)


  # Private
  # -------

  # Every snippet added or moved most come through here.
  # Notifies the snippetTree if the parent snippet is
  # attached to one.
  _attachSnippet: (snippet, position = {}) ->
    func = =>
      @_link(snippet, position)

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
  # cases _unlink can be used
  _detachSnippet: (snippet) ->
    func = =>
      @_unlink(snippet)

    if snippetTree = @getSnippetTree()
      snippetTree.detachingSnippet(snippet, func)
    else
      func()


  _link: (snippet, position) ->
    if snippet.parentContainer
        @_unlink(snippet)

      position.parentContainer = this
      @_setSnippetPosition(snippet, position)


  _unlink: (snippet) ->
    container = snippet.parentContainer
    if container

      # update parentContainer links
      container.first = snippet.next if !snippet.previous?
      container.last = snippet.previous if !snippet.next?

      # update previous and next nodes
      snippet.next?.previous = snippet.previous
      snippet.previous?.next = snippet.next

      @_setSnippetPosition(snippet, {})


  _setSnippetPosition: (snippet, { parentContainer, previous, next }) ->
    snippet.parentContainer = parentContainer
    snippet.previous = previous
    snippet.next = next


