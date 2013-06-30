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
#       - Snippet 'Hero'
#       - Snippet '2 Columns'
#         - SnippetContainer 'main'
#           - Snippet 'Title'
#         - SnippetContainer 'sidebar'
#           - Snippet 'Info-Box''
#
# ### Events:
# The first set of SnippetTree Events are concerned with layout changes like
# adding, removing or moving snippets.
#
# Consider: Have a documentFragment as the rootNode if no rootNode is given
# maybe this would help simplify some code (since snippets are always
# attached to the DOM).
class SnippetTree

  constructor: ({ content, design } = {}) ->
    @root = new SnippetContainer(isRoot: true)

    # initialize content before we set the snippet tree to the root
    # otherwise all the events will be triggered while building the tree
    if content? and design?
      @fromJson(content, design)

    @root.snippetTree = this

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

    # content changes
    @snippetContentChanged = $.Callbacks()
    @snippetHtmlChanged = $.Callbacks()
    @snippetSettingsChanged = $.Callbacks()

    @changed = $.Callbacks()


  # Traverse the whole snippet tree.
  each: (callback) ->
    @root.each(callback)


  eachContainer: (callback) ->
    @root.eachContainer(callback)


  # Traverse all containers and snippets
  all: (callback) ->
    @root.all(callback)


  find: (search) ->
    if typeof search == 'string'
      res = []
      @each (snippet) ->
        if snippet.identifier == search || snippet.template.name == search
          res.push(snippet)

      new SnippetArray(res)
    else
      new SnippetArray()


  detach: ->
    @root.snippetTree = undefined
    @each (snippet) ->
      snippet.snippetTree = undefined

    oldRoot = @root
    @root = new SnippetContainer(isRoot: true)

    oldRoot


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
      @fireEvent('snippetMoved', snippet)
    else
      if snippet.snippetTree?
        # remove from other snippet tree
        snippet.snippetContainer.detachSnippet(snippet)

      snippet.descendantsAndSelf (descendant) =>
        descendant.snippetTree = this

      attachSnippetFunc()
      @fireEvent('snippetAdded', snippet)


  fireEvent: (event, args...) ->
    this[event].fire.apply(event, args)
    @changed.fire()


  detachingSnippet: (snippet, detachSnippetFunc) ->
    if snippet.snippetTree == this

      snippet.descendantsAndSelf (descendants) ->
        descendants.snippetTree = undefined

      detachSnippetFunc()
      @fireEvent('snippetRemoved', snippet)
    else
      log.error('cannot remove snippet from another SnippetTree')


  contentChanging: (snippet) ->
    @fireEvent('snippetContentChanged', snippet)


  # Serialization
  # -------------

  printJson: ->
    S.readableJson(@toJson())


  # returns a JSON representation of the whole tree
  toJson: ->
    json = {}
    json['content'] = []

    snippetToJson = (snippet, level, containerArray) ->
      snippetJson = snippet.toJson()
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

    walker(@root.first, 0, json['content']) if @root.first

    json


  fromJson: (json, design) ->
    @root.snippetTree = undefined
    for snippetJson in json.content
      snippet = Snippet.fromJson(snippetJson, design)
      @root.append(snippet)

    @root.snippetTree = this
    @root.each (snippet) =>
      snippet.snippetTree = this



