# Snippet
# -------
# Snippets are more or less the equivalent to nodes in the DOM tree.
# Each snippet has a Template which allows to generate HTML
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


  constructor: ({ @template, id } = {}) ->
    if !@template
      log.error('cannot instantiate snippet without template reference')

    @initializeContainers()
    @initializeEditables()
    @initializeImages()

    @id = id || guid.next()
    @identifier = @template.identifier

    @next = undefined # set by SnippetContainer
    @previous = undefined # set by SnippetContainer
    @snippetTree = undefined # set by SnippetTree


  initializeContainers: ->
    @containerCount = @template.directives.count.container
    for containerName of @template.directives.container
      @containers ||= {}
      @containers[containerName] = new SnippetContainer
        name: containerName
        parentSnippet: this


  initializeEditables: ->
    @editableCount = @template.directives.count.editable
    for editableName of @template.directives.editable
      @editables ||= {}
      @editables[editableName] = undefined


  initializeImages: ->
    @imageCount = @template.directives.count.image
    for imageName of @template.directives.image
      @images ||= {}
      @images[imageName] = undefined


  hasImages: ->
    @imageCount > 0


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
      containerName = templateAttr.defaultValues.container

    @containers[containerName].append(snippet)
    this


  prepend: (containerName, snippet) ->
    if arguments.length == 1
      snippet = containerName
      containerName = templateAttr.defaultValues.container

    @containers[containerName].prepend(snippet)
    this


  set: (name, value) ->
    if @editables?.hasOwnProperty(name)
      if @editables[name] != value
        @editables[name] = value
        @snippetTree.contentChanging(this) if @snippetTree
    else if @images?.hasOwnProperty(name)
      if @images[name] != value
        @images[name] = value
        @snippetTree.contentChanging(this) if @snippetTree
    else
      log.error("set error: #{ @identifier } has no content named #{ name }")


  get: (name) ->
    if @editables?.hasOwnProperty(name)
      @editables[name]
    else if @images?.hasOwnProperty(name)
      @images[name]
    else
      log.error("get error: #{ @identifier } has no name named #{ name }")


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
        callback(snippet)
        snippet.descendants(callback)
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
      id: @id
      identifier: @identifier

    if @hasEditables()
      json.editables = {}
      for name, value of @editables
        json.editables[name] = value

    for name of @images
      json.images ||= {}
      for name, value of @images
        json.images[name] = value

    for name of @containers
      json.containers ||= {}
      json.containers[name] = []

    json


Snippet.fromJson = (json, design) ->
  template = design.get(json.identifier)

  if not template?
    log.error("error while deserializing snippet: unknown template identifier '#{ json.identifier }'")

  snippet = new Snippet({ template, id: json.id })
  for editableName, value of json.editables
    if snippet.editables.hasOwnProperty(editableName)
      snippet.editables[editableName] = value
    else
      log.error("error while deserializing snippet: unknown editable #{ editableName }")

  for imageName, value of json.images
    if snippet.images.hasOwnProperty(imageName)
      snippet.images[imageName] = value
    else
      log.error("error while deserializing snippet: unknown image #{ imageName }")

  for containerName, snippetArray of json.containers
    if not snippet.containers.hasOwnProperty(containerName)
      log.error("error while deserializing snippet: unknown container #{ containerName }")

    if snippetArray

      if not $.isArray(snippetArray)
        log.error("error while deserializing snippet: container is not array #{ containerName }")

      for child in snippetArray
        snippet.append( containerName, Snippet.fromJson(child, design) )

  snippet
