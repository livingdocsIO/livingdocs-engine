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
    assert @template, 'cannot instantiate snippet without template reference'

    @initializeDirectives()
    @styles = {}
    @dataValues = {}
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
        when 'editable', 'image', 'html'
          @content ||= {}
          @content[directive.name] = undefined
        else
          log.error "Template directive type '#{ directive.type }' not implemented in SnippetModel"


  createView: (isReadOnly) ->
    @template.createView(this, isReadOnly)


  hasContainers: ->
    @template.directives.count('container') > 0


  hasEditables: ->
    @template.directives.count('editable') > 0


  hasHtml: ->
    @template.directives.count('html') > 0


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
      containerName = config.directives.container.defaultName

    @containers[containerName].append(snippetModel)
    this


  prepend: (containerName, snippetModel) ->
    if arguments.length == 1
      snippetModel = containerName
      containerName = config.directives.container.defaultName

    @containers[containerName].prepend(snippetModel)
    this


  set: (name, value) ->
    assert @content?.hasOwnProperty(name),
      "set error: #{ @identifier } has no content named #{ name }"

    if @content[name] != value
      @content[name] = value
      @snippetTree.contentChanging(this, name) if @snippetTree


  get: (name) ->
    assert @content?.hasOwnProperty(name),
      "get error: #{ @identifier } has no content named #{ name }"

    @content[name]


  # can be called with a string or a hash
  data: (arg) ->
    if typeof(arg) == 'object'
      changedDataProperties = []
      for name, value of arg
        if @changeData(name, value)
          changedDataProperties.push(name)
      if @snippetTree && changedDataProperties.length > 0
        @snippetTree.dataChanging(this, changedDataProperties)
    else
      @dataValues[arg]


  changeData: (name, value) ->
    if !jsonHelper.deepEquals(@dataValues[name], value)
      @dataValues[name] = value
      true
    else
      false


  isEmpty: (name) ->
    value = @get(name)
    value == undefined || value == ''


  style: (name, value) ->
    if arguments.length == 1
      @styles[name]
    else
      @setStyle(name, value)


  setStyle: (name, value) ->
    style = @template.styles[name]
    if not style
      log.warn "Unknown style '#{ name }' in SnippetModel #{ @identifier }"
    else if not style.validateValue(value)
      log.warn "Invalid value '#{ value }' for style '#{ name }' in SnippetModel #{ @identifier }"
    else
      if @styles[name] != value
        @styles[name] = value
        if @snippetTree
          @snippetTree.htmlChanging(this, 'style', { name, value })


  copy: (design) ->
    json = @toJson()
    json.id = guid.next()
    SnippetModel.fromJson(json, design)

    #log.warn("SnippetModel#copy() is not implemented yet.")

    # serializing/deserializing should work but needs to get some tests first
    # json = @toJson()
    # json.id = guid.next()
    # SnippetModel.fromJson(json)


  copyWithoutContent: ->
    @template.createModel()


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

    unless jsonHelper.isEmpty(@content)
      json.content = jsonHelper.flatCopy(@content)

    unless jsonHelper.isEmpty(@styles)
      json.styles = jsonHelper.flatCopy(@styles)

    unless jsonHelper.isEmpty(@dataValues)
      json.data = $.extend(true, {}, @dataValues)

    # create an array for every container
    for name of @containers
      json.containers ||= {}
      json.containers[name] = []

    json


SnippetModel.fromJson = (json, design) ->
  template = design.get(json.identifier)

  assert template,
    "error while deserializing snippet: unknown template identifier '#{ json.identifier }'"

  model = new SnippetModel({ template, id: json.id })

  for name, value of json.content
    assert model.content.hasOwnProperty(name),
      "error while deserializing snippet: unknown content '#{ name }'"
    model.content[name] = value

  for styleName, value of json.styles
    model.style(styleName, value)

  model.data(json.data) if json.data

  for containerName, snippetArray of json.containers
    assert model.containers.hasOwnProperty(containerName),
      "error while deserializing snippet: unknown container #{ containerName }"

    if snippetArray
      assert $.isArray(snippetArray),
        "error while deserializing snippet: container is not array #{ containerName }"
      for child in snippetArray
        model.append( containerName, SnippetModel.fromJson(child, design) )

  model
