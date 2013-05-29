# SnippetTree
# -----------
# Livingdocs equivalent to the DOM tree.
# A snippet tree containes all the snippets of a page in hierarchical order.
#
# The root of the SnippetTree is a SnippetContainer. A SnippetContainer
# contains a list of snippets.
#
# snippets can have multible SnippetContainers themselves.
#
# ### Example:
#     - SnippetContainer (root)
#       - snippet 'Hero'
#       - snippet '2 Columns'
#         - SnippetContainer 'main'
#           - snippet 'Title'
#         - SnippetContainer 'sidebar'
#           - snippet 'Info-Box''
#
# ### Events:
# The first set of SnippetTree Events are concerned with layout changes like
# adding, removing or moving snippets.
#
# Consider: Have a documentFragment as the rootNode if no rootNode is given
# maybe this would help simplify some code (since snippets are always
# attached to the DOM).

class SnippetTree

  constructor: ({ content } = {}) ->
    @root = new SnippetContainer(snippetTree: this)
    @history = new History()
    @initializeEvents()


  # insert snippet at the beginning
  prepend: (snippet) ->
    @root.prepend(snippet)
    @ #chaining


  # insert snippet at the end
  append: (snippet) ->
    @root.append(snippet)
    @ #chaining


  initializeEvents: () ->

    # layout changes
    @snippetAdded = $.Callbacks()
    @snippetRemoved = $.Callbacks()
    @snippetMoved = $.Callbacks()
    # snippetContainerMoved: $.Callbacks()

    # content changes
    @snippetContentChanged = $.Callbacks()
    @snippetHtmlChanged = $.Callbacks()
    @snippetSettingsChanged = $.Callbacks()


  # Traverse the whole snippet tree.
  each: (callback) ->
    @root.each(callback)


  # returns a readable string representation of the whole tree
  print: () ->
    output = "SnippetTree\n-----------\n"

    addLine = (text, indentation = 0) ->
      output += "#{ Array(indentation + 1).join(" ") }#{ text }\n"

    walker = (snippet, indentation = 0) ->
      template = snippet.template
      addLine("- #{ template.title } (#{ template.identifier })", indentation)

      # traverse children
      for name, snippetContainer of snippet.containers
        addLine("#{ name }:", indentation + 2)
        walker(snippetContainer.first, indentation + 4) if snippetContainer.first

      # traverse siblings
      walker(snippet.next, indentation) if snippet.next

    walker(@root.first) if @root.first
    return output


  # Tree Change Events
  # ------------------
  # Raise events for Add, Remove and Move of snippets
  # These functions should only be called by snippetContainers

  attachingSnippet: (snippet, attachSnippetFunc) ->

    if snippet.snippetTree == this
      # move snippet
      attachSnippetFunc()
      @snippetMoved.fire(snippet)
    else
      if snippet.snippetTree?
        # remove from other snippet tree
        snippet.snippetContainer.detachSnippet(snippet)

      snippet.descendantsAndSelf (sni) =>
        sni?.snippetTree = this

      attachSnippetFunc()
      @snippetAdded.fire(snippet)


  detachingSnippet: (snippet, detachSnippetFunc) ->
    if snippet.snippetTree == this

      snippet.descendantsAndSelf (sni) ->
        sni.snippetTree = undefined

      detachSnippetFunc()
      @snippetRemoved.fire(snippet)
    else
      error("cannot remove snippet from another SnippetTree")


  # Serialization
  # -------------

  # returns a JSON representation of the whole tree
  toJson: () ->
    #todo

