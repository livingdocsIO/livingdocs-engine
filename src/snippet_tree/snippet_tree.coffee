assert = require('../modules/logging/assert')
SnippetContainer = require('./snippet_container')
SnippetArray = require('./snippet_array')
SnippetModel = require('./snippet_model')

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
# adding, removing or moving snippets.
#
# Consider: Have a documentFragment as the rootNode if no rootNode is given
# maybe this would help simplify some code (since snippets are always
# attached to the DOM).
module.exports = class SnippetTree


  constructor: ({ content, @design } = {}) ->
    @root = new SnippetContainer(isRoot: true)

    # initialize content before we set the snippet tree to the root
    # otherwise all the events will be triggered while building the tree
    if content? and @design?
      @fromJson(content, @design)

    @root.snippetTree = this
    @initializeEvents()


  # Insert a snippet at the beginning.
  # @param: snippetModel instance or snippet name e.g. 'title'
  prepend: (snippet) ->
    snippet = @getSnippet(snippet)
    @root.prepend(snippet) if snippet?
    this


  # Insert snippet at the end.
  # @param: snippetModel instance or snippet name e.g. 'title'
  append: (snippet) ->
    snippet = @getSnippet(snippet)
    @root.append(snippet) if snippet?
    this


  getSnippet: (snippetName) ->
    if jQuery.type(snippetName) == 'string'
      @createModel(snippetName)
    else
      snippetName


  createModel: (identifier) ->
    template = @getTemplate(identifier)
    template.createModel() if template


  getTemplate: (identifier) ->
    template = @design.get(identifier)
    assert template, "Could not find template #{ identifier }"
    template


  initializeEvents: () ->

    # layout changes
    @snippetAdded = $.Callbacks()
    @snippetRemoved = $.Callbacks()
    @snippetMoved = $.Callbacks()

    # content changes
    @snippetContentChanged = $.Callbacks()
    @snippetHtmlChanged = $.Callbacks()
    @snippetSettingsChanged = $.Callbacks()

    @changed = $.Callbacks()


  # Traverse the whole snippet tree.
  each: (callback) ->
    @root.each(callback)


  eachContainer: (callback) ->
    @root.eachContainer(callback)


  # Get the first snippet
  first: ->
    @root.first


  # Traverse all containers and snippets
  all: (callback) ->
    @root.all(callback)


  find: (search) ->
    if typeof search == 'string'
      res = []
      @each (snippet) ->
        if snippet.identifier == search || snippet.template.id == search
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
  # Raise events for Add, Remove and Move of snippets
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
    assert snippet.snippetTree is this,
      'cannot remove snippet from another SnippetTree'

    snippet.descendantsAndSelf (descendants) ->
      descendants.snippetTree = undefined

    detachSnippetFunc()
    @fireEvent('snippetRemoved', snippet)


  contentChanging: (snippet) ->
    @fireEvent('snippetContentChanged', snippet)


  htmlChanging: (snippet) ->
    @fireEvent('snippetHtmlChanged', snippet)


  # Serialization
  # -------------

  printJson: ->
    words.readableJson(@toJson())


  # Returns a serialized representation of the whole tree
  # that can be sent to the server as JSON.
  serialize: ->
    data = {}
    data['content'] = []

    snippetToData = (snippet, level, containerArray) ->
      snippetData = snippet.toJson()
      containerArray.push snippetData
      snippetData

    walker = (snippet, level, dataObj) ->
      snippetData = snippetToData(snippet, level, dataObj)

      # traverse children
      for name, snippetContainer of snippet.containers
        containerArray = snippetData.containers[snippetContainer.name] = []
        walker(snippetContainer.first, level + 1, containerArray) if snippetContainer.first

      # traverse siblings
      walker(snippet.next, level, dataObj) if snippet.next

    walker(@root.first, 0, data['content']) if @root.first

    data


  toJson: ->
    @serialize()


  fromJson: (data, design) ->
    @root.snippetTree = undefined
    if data.content
      for snippetData in data.content
        snippet = SnippetModel.fromJson(snippetData, design)
        @root.append(snippet)

    @root.snippetTree = this
    @root.each (snippet) =>
      snippet.snippetTree = this



