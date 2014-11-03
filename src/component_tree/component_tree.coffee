assert = require('../modules/logging/assert')
ComponentContainer = require('./component_container')
SnippetArray = require('./snippet_array')
ComponentModel = require('./component_model')
componentModelSerializer = require('./component_model_serializer')

# ComponentTree
# -----------
# Livingdocs equivalent to the DOM tree.
# A snippet tree containes all the snippets of a page in hierarchical order.
#
# The root of the ComponentTree is a ComponentContainer. A ComponentContainer
# contains a list of snippets.
#
# snippets can have multible ComponentContainers themselves.
#
# ### Example:
#     - ComponentContainer (root)
#       - Snippet 'Hero'
#       - Snippet '2 Columns'
#         - ComponentContainer 'main'
#           - Snippet 'Title'
#         - ComponentContainer 'sidebar'
#           - Snippet 'Info-Box''
#
# ### Events:
# The first set of ComponentTree Events are concerned with layout changes like
# adding, removing or moving snippets.
#
# Consider: Have a documentFragment as the rootNode if no rootNode is given
# maybe this would help simplify some code (since snippets are always
# attached to the DOM).
module.exports = class ComponentTree


  constructor: ({ content, @design } = {}) ->
    assert @design?, "Error instantiating ComponentTree: design param is misssing."
    @root = new ComponentContainer(isRoot: true)

    # initialize content before we set the snippet tree to the root
    # otherwise all the events will be triggered while building the tree
    @fromJson(content, @design) if content?

    @root.componentTree = this
    @initializeEvents()


  # Insert a snippet at the beginning.
  # @param: componentModel instance or snippet name e.g. 'title'
  prepend: (snippet) ->
    snippet = @getSnippet(snippet)
    @root.prepend(snippet) if snippet?
    this


  # Insert snippet at the end.
  # @param: componentModel instance or snippet name e.g. 'title'
  append: (snippet) ->
    snippet = @getSnippet(snippet)
    @root.append(snippet) if snippet?
    this


  getSnippet: (snippetName) ->
    if typeof snippetName == 'string'
      @createModel(snippetName)
    else
      snippetName


  createModel: (componentName) ->
    template = @getTemplate(componentName)
    template.createModel() if template


  createComponent: ->
    @createModel.apply(this, arguments)


  getTemplate: (componentName) ->
    template = @design.get(componentName)
    assert template, "Could not find template #{ componentName }"
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
    @snippetDataChanged = $.Callbacks()

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
        if snippet.componentName == search
          res.push(snippet)

      new SnippetArray(res)
    else
      new SnippetArray()


  detach: ->
    @root.componentTree = undefined
    @each (snippet) ->
      snippet.componentTree = undefined

    oldRoot = @root
    @root = new ComponentContainer(isRoot: true)

    oldRoot


  # eachWithParents: (snippet, parents) ->
  #   parents ||= []

  #   # traverse
  #   parents = parents.push(snippet)
  #   for name, componentContainer of snippet.containers
  #     snippet = componentContainer.first

  #     while (snippet)
  #       @eachWithParents(snippet, parents)
  #       snippet = snippet.next

  #   parents.splice(-1)


  # returns a readable string representation of the whole tree
  print: () ->
    output = 'ComponentTree\n-----------\n'

    addLine = (text, indentation = 0) ->
      output += "#{ Array(indentation + 1).join(" ") }#{ text }\n"

    walker = (snippet, indentation = 0) ->
      template = snippet.template
      addLine("- #{ template.label } (#{ template.name })", indentation)

      # traverse children
      for name, componentContainer of snippet.containers
        addLine("#{ name }:", indentation + 2)
        walker(componentContainer.first, indentation + 4) if componentContainer.first

      # traverse siblings
      walker(snippet.next, indentation) if snippet.next

    walker(@root.first) if @root.first
    return output


  # Tree Change Events
  # ------------------
  # Raise events for Add, Remove and Move of snippets
  # These functions should only be called by componentContainers

  attachingSnippet: (snippet, attachSnippetFunc) ->
    if snippet.componentTree == this
      # move snippet
      attachSnippetFunc()
      @fireEvent('snippetMoved', snippet)
    else
      if snippet.componentTree?
        # remove from other snippet tree
        snippet.componentContainer.detachSnippet(snippet)

      snippet.descendantsAndSelf (descendant) =>
        descendant.componentTree = this

      attachSnippetFunc()
      @fireEvent('snippetAdded', snippet)


  fireEvent: (event, args...) ->
    this[event].fire.apply(event, args)
    @changed.fire()


  detachingSnippet: (snippet, detachSnippetFunc) ->
    assert snippet.componentTree is this,
      'cannot remove snippet from another ComponentTree'

    snippet.descendantsAndSelf (descendants) ->
      descendants.componentTree = undefined

    detachSnippetFunc()
    @fireEvent('snippetRemoved', snippet)


  contentChanging: (snippet) ->
    @fireEvent('snippetContentChanged', snippet)


  htmlChanging: (snippet) ->
    @fireEvent('snippetHtmlChanged', snippet)


  dataChanging: (snippet, changedProperties) ->
    @fireEvent('snippetDataChanged', snippet, changedProperties)


  # Serialization
  # -------------

  printJson: ->
    words.readableJson(@toJson())


  # Returns a serialized representation of the whole tree
  # that can be sent to the server as JSON.
  serialize: ->
    data = {}
    data['content'] = []
    data['design'] = { name: @design.name }

    snippetToData = (snippet, level, containerArray) ->
      snippetData = snippet.toJson()
      containerArray.push snippetData
      snippetData

    walker = (snippet, level, dataObj) ->
      snippetData = snippetToData(snippet, level, dataObj)

      # traverse children
      for name, componentContainer of snippet.containers
        containerArray = snippetData.containers[componentContainer.name] = []
        walker(componentContainer.first, level + 1, containerArray) if componentContainer.first

      # traverse siblings
      walker(snippet.next, level, dataObj) if snippet.next

    walker(@root.first, 0, data['content']) if @root.first

    data


  # Initialize a componentTree
  # This method suppresses change events in the componentTree.
  #
  # Consider to change params:
  # fromData({ content, design, silent }) # silent [boolean]: suppress change events
  fromData: (data, design, silent=true) ->
    if design?
      assert not @design? || design.equals(@design), 'Error loading data. Specified design is different from current componentTree design'
    else
      design = @design

    if silent
      @root.componentTree = undefined

    if data.content
      for snippetData in data.content
        snippet = componentModelSerializer.fromJson(snippetData, design)
        @root.append(snippet)

    if silent
      @root.componentTree = this
      @root.each (snippet) =>
        snippet.componentTree = this


  # Append data to this componentTree
  # Fires snippetAdded event for every snippet
  addData: (data, design) ->
    @fromData(data, design, false)


  addDataWithAnimation: (data, delay=200) ->
    assert @design?, 'Error adding data. ComponentTree has no design'

    timeout = Number(delay)
    for snippetData in data.content
      do =>
        content = snippetData
        setTimeout =>
          snippet = componentModelSerializer.fromJson(content, @design)
          @root.append(snippet)
        , timeout

      timeout += Number(delay)


  toData: ->
    @serialize()


  # Aliases
  # -------

  fromJson: (args...) ->
    @fromData.apply(this, args)


  toJson: (args...) ->
    @toData.apply(this, args)


