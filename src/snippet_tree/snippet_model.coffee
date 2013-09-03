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

    @initializeDirectives()

    @id = id || guid.next()
    @identifier = @template.identifier

    @next = undefined # set by SnippetContainer
    @previous = undefined # set by SnippetContainer
    @snippetTree = undefined # set by SnippetTree


  initializeDirectives: ->
    for directive in @template.directives
      switch directive.type
        when 'container'
          @containers ||= {}
          @containers[directive.name] = new SnippetContainer
            name: directive.name
            parentSnippet: this
        when 'editable', 'image'
          @content ||= {}
          @content[directive.name] = undefined
        else
          log.error "Template directive type '#{ directive.type }' not implemented in SnippetModel"


  hasContainers: ->
    @template.directives.count('container') > 0


  hasEditables: ->
    @template.directives.count('editable') > 0


  hasImages: ->
    @template.directives.count('image') > 0


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
    if @content?.hasOwnProperty(name)
      if @content[name] != value
        @content[name] = value
        @snippetTree.contentChanging(this, name) if @snippetTree
    else
      log.error("set error: #{ @identifier } has no content named #{ name }")


  get: (name) ->
    if @content?.hasOwnProperty(name)
      @content[name]
    else
      log.error("get error: #{ @identifier } has no name named #{ name }")


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

    for name, value of @content
      json.content ||= {}
      json.content[name] = value

    for name of @containers
      json.containers ||= {}
      json.containers[name] = []

    json


SnippetModel.fromJson = (json, design) ->
  template = design.get(json.identifier)

  if not template?
    log.error("error while deserializing snippet: unknown template identifier '#{ json.identifier }'")

  model = new SnippetModel({ template, id: json.id })
  for name, value of json.content
    if model.content.hasOwnProperty(name)
      model.content[name] = value
    else
      log.error("error while deserializing snippet: unknown content '#{ name }'")

  for containerName, snippetArray of json.containers
    if not model.containers.hasOwnProperty(containerName)
      log.error("error while deserializing snippet: unknown container #{ containerName }")

    if snippetArray

      if not $.isArray(snippetArray)
        log.error("error while deserializing snippet: container is not array #{ containerName }")

      for child in snippetArray
        model.append( containerName, SnippetModel.fromJson(child, design) )

  model
