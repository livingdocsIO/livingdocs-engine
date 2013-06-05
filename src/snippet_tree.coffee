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
    @root = new SnippetContainer(snippetTree: this, isRoot: true)
    @history = new History()
    @initializeEvents()


  # insert snippet at the beginning
  prepend: (snippet) ->
    @root.prepend(snippet)
    this


  # insert snippet at the end
  append: (snippet) ->
    @root.append(snippet)
    this


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


  # eachWithParents: (snippet, parents) ->
  #   parents ||= []

  #   # traverse
  #   parents = parents.push(snippet)
  #   for name, snippetContainer of snippet.containers
  #     snippet = snippetContainer.first

  #     while (snippet)
  #       @eachWithParents(snippet, parents)
  #       snippet = snippet.next

  #   parents.splice(-1)


  # returns a readable string representation of the whole tree
  print: () ->
    output = 'SnippetTree\n-----------\n'

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
      error('cannot remove snippet from another SnippetTree')


  contentChanging: (snippet) ->
    @snippetContentChanged.fire(snippet)


  # Serialization
  # -------------

  printJson: ->
    S.readableJson(@toJson())


  # returns a JSON representation of the whole tree
  toJson: ->
    json = {}
    json['root'] = []

    snippetToJson = (snippet, level, containerArray) ->
      snippetJson = snippet.toJson()
      snippetJson.level = level
      containerArray.push snippetJson

      snippetJson


    walker = (snippet, level, jsonObj) ->
      snippetJson = snippetToJson(snippet, level, jsonObj)

      # traverse children
      for name, snippetContainer of snippet.containers
        containerArray = snippetJson.containers[snippetContainer.name] = []
        walker(snippetContainer.first, level + 1, containerArray) if snippetContainer.first

      # traverse siblings
      walker(snippet.next, level, jsonObj) if snippet.next

    walker(@root.first, 0, json['root']) if @root.first
    return json


    # if container.isRoot

    # for name, snippetContainer of @containers
    #   snippet = snippetContainer.first
    #   while (snippet)
    #     snippet.descendants(callback)
    #     callback(snippet)
    #     snippet = snippet.next

