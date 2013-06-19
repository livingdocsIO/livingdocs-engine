# Snippet
# -------
# Snippets are more or less the equivalent to nodes in the DOM tree.
# Each snippet has a SnippetTemplate which allows to generate HTML
# from a snippet or generate a snippet instance from HTML.
#
# Represents a node in a SnippetTree.
# Every snippet can have a parent (SnippetContainer),
# siblings (other snippets) and multiple containers (SnippetContainers).
#
# The containers are the parents of the child Snippets.
# E.g. a grid row would have as many containers as it has
# columns
#
# # @prop parentContainer: parent SnippetContainer
class Snippet


  constructor: ({ @template } = {}) ->
    if !@template
      error('cannot instantiate snippet without template reference')

    @initializeContainers()
    @initializeEditables()

    @identifier = @template.identifier

    @next = undefined # set by SnippetContainer
    @previous = undefined # set by SnippetContainer
    @snippetTree = undefined # set by SnippetTree


  initializeContainers: ->
    @containerCount = @template.containerCount
    for containerName of @template.containers
      @containers ||= {}
      @containers[containerName] = new SnippetContainer
        name: containerName
        parentSnippet: this


  initializeEditables: ->
    @editableCount = @template.editableCount
    for editableName of @template.editables
      @editables ||= {}
      @editables[editableName] = undefined


  hasContainers: ->
    @containers?


  before: (snippet) ->
    if snippet
      @parentContainer.insertBefore(this, snippet)
      this
    else
      @previous


  after: (snippet) ->
    if snippet
      @parentContainer.insertAfter(this, snippet)
      this
    else
      @next


  append: (containerName, snippet) ->
    if arguments.length == 1
      snippet = containerName
      containerName = config.defaultContainerName

    @containers[containerName].append(snippet)
    this


  prepend: (containerName, snippet) ->
    if arguments.length == 1
      snippet = containerName
      containerName = config.defaultContainerName

    @containers[containerName].prepend(snippet)
    this


  set: (editable, value) ->
    if arguments.length == 1
      value = editable
      editable = config.defaultEditableName

    if @editables?.hasOwnProperty(editable)
      if @editables[editable] != value
        @editables[editable] = value
        @snippetTree.contentChanging(this) if @snippetTree
    else
      error("set error: #{ @identifier } has no editable named #{ editable }")


  get: (editable) ->
    if arguments.length == 0
      editable = config.defaultFieldName

    if @editables?.hasOwnProperty(editable)
      @editables[editable]
    else
      error("get error: #{ @identifier } has no editable named #{ editable }")


  # creates a snippetHtml instance for this snippet
  createHtml: () ->
    @template.createHtml(this) unless @snippetHtml?


  hasEditables: ->
    @editables?


  # move up (previous)
  up: ->
    @parentContainer.up(this)
    this


  # move down (next)
  down: ->
    @parentContainer.down(this)
    this


  # remove TreeNode from its container and SnippetTree
  remove: ->
    @parentContainer.remove(this)


  # @api private
  destroy: ->
    # todo: move into to renderer

    # remove user interface elements
    @uiInjector.remove() if @uiInjector


  getParent: ->
     @parentContainer?.parentSnippet


  ui: ->
    if not @uiInjector
      @snippetTree.renderer.createInterfaceInjector(this)
    @uiInjector


  # Iterators
  # ---------

  parents: (callback) ->
    snippet = this
    while (snippet = snippet.getParent())
      callback(snippet)


  children: (callback) ->
    for name, snippetContainer of @containers
      snippet = snippetContainer.first
      while (snippet)
        callback(snippet)
        snippet = snippet.next


  descendants: (callback) ->
    for name, snippetContainer of @containers
      snippet = snippetContainer.first
      while (snippet)
        snippet.descendants(callback)
        callback(snippet)
        snippet = snippet.next


  descendantsAndSelf: (callback) ->
    callback(this)
    @descendants(callback)


  # return all descendant containers (including those of this snippet)
  descendantContainers: (callback) ->
    @descendantsAndSelf (snippet) ->
      for name, snippetContainer of snippet.containers
        callback(snippetContainer)


  # return all descendant containers and snippets
  allDescendants: (callback) ->
    @descendantsAndSelf (snippet) =>
      callback(snippet) if snippet != this
      for name, snippetContainer of snippet.containers
        callback(snippetContainer)


  childrenAndSelf: (callback) ->
    callback(this)
    @children(callback)


  # Serialization
  # -------------

  toJson: ->

    json =
      identifier: @identifier

    if @hasEditables()
      json.editables = {}
      for name, value of @editables
        json.editables[name] = value

    for name of @containers
      json.containers ||= {}
      json.containers[name] = []

    json


Snippet.fromJson = (json, design) ->
  template = design.get(json.identifier)

  snippet = new Snippet({ template })
  for editableName, value of json.editables
    if snippet.editables.hasOwnProperty(editableName)
      snippet.editables[editableName] = value
    else
      error("error while deserializing snippet: unknown editable #{ editableName }")

  for containerName, snippetArray of json.containers
    if snippetArray
      for child in snippetArray
        snippet.append( containerName, Snippet.fromJson(child, design) )

  snippet






