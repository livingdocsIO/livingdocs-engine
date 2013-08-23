# SnippetModel
# ------------
# Each SnippetModel has a template which allows to generate a snippetView
# from a snippetModel
#
# Represents a node in a SnippetTree.
# Every SnippetModel can have a parent (SnippetContainer),
# siblings (other snippets) and multiple containers (SnippetContainers).
#
# The containers are the parents of the child SnippetModels.
# E.g. a grid row would have as many containers as it has
# columns
#
# # @prop parentContainer: parent SnippetContainer
class SnippetModel


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
    @containerCount = @template.directives.count('container')
    return unless @containerCount

    for directive in @template.directives.container
      @containers ||= {}
      @containers[directive.name] = new SnippetContainer
        name: directive.name
        parentSnippet: this


  initializeEditables: ->
    @editableCount = @template.directives.count('editable')
    return unless @editableCount

    for directive in @template.directives.editable
      @editables ||= {}
      @editables[directive.name] = undefined


  initializeImages: ->
    @imageCount = @template.directives.count('image')
    return unless @imageCount

    for directive in @template.directives.image
      @images ||= {}
      @images[directive.name] = undefined


  hasImages: ->
    @imageCount > 0


  hasContainers: ->
    @containers?


  before: (snippetModel) ->
    if snippetModel
      @parentContainer.insertBefore(this, snippetModel)
      this
    else
      @previous


  after: (snippetModel) ->
    if snippetModel
      @parentContainer.insertAfter(this, snippetModel)
      this
    else
      @next


  append: (containerName, snippetModel) ->
    if arguments.length == 1
      snippetModel = containerName
      containerName = templateAttr.defaultValues.container

    @containers[containerName].append(snippetModel)
    this


  prepend: (containerName, snippetModel) ->
    if arguments.length == 1
      snippetModel = containerName
      containerName = templateAttr.defaultValues.container

    @containers[containerName].prepend(snippetModel)
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
    snippetModel = this
    while (snippetModel = snippetModel.getParent())
      callback(snippetModel)


  children: (callback) ->
    for name, snippetContainer of @containers
      snippetModel = snippetContainer.first
      while (snippetModel)
        callback(snippetModel)
        snippetModel = snippetModel.next


  descendants: (callback) ->
    for name, snippetContainer of @containers
      snippetModel = snippetContainer.first
      while (snippetModel)
        callback(snippetModel)
        snippetModel.descendants(callback)
        snippetModel = snippetModel.next


  descendantsAndSelf: (callback) ->
    callback(this)
    @descendants(callback)


  # return all descendant containers (including those of this snippetModel)
  descendantContainers: (callback) ->
    @descendantsAndSelf (snippetModel) ->
      for name, snippetContainer of snippetModel.containers
        callback(snippetContainer)


  # return all descendant containers and snippets
  allDescendants: (callback) ->
    @descendantsAndSelf (snippetModel) =>
      callback(snippetModel) if snippetModel != this
      for name, snippetContainer of snippetModel.containers
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


SnippetModel.fromJson = (json, design) ->
  template = design.get(json.identifier)

  if not template?
    log.error("error while deserializing snippet: unknown template identifier '#{ json.identifier }'")

  model = new SnippetModel({ template, id: json.id })
  for editableName, value of json.editables
    if model.editables.hasOwnProperty(editableName)
      model.editables[editableName] = value
    else
      log.error("error while deserializing snippet: unknown editable #{ editableName }")

  for imageName, value of json.images
    if model.images.hasOwnProperty(imageName)
      model.images[imageName] = value
    else
      log.error("error while deserializing snippet: unknown image #{ imageName }")

  for containerName, snippetArray of json.containers
    if not model.containers.hasOwnProperty(containerName)
      log.error("error while deserializing snippet: unknown container #{ containerName }")

    if snippetArray

      if not $.isArray(snippetArray)
        log.error("error while deserializing snippet: container is not array #{ containerName }")

      for child in snippetArray
        model.append( containerName, SnippetModel.fromJson(child, design) )

  model
