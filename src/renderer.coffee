class Renderer


  constructor: ({ @snippetTree, @renderingContainer }) ->
    assert @snippetTree, 'no snippet tree specified'
    assert @renderingContainer, 'no rendering container specified'

    @$root = $(@renderingContainer.renderNode)
    @setupSnippetTreeListeners()
    @snippetViews = {}


  html: ->
    @render()
    @renderingContainer.html()


  # Snippet Tree Event Handling
  # ---------------------------

  setupSnippetTreeListeners: ->
    @snippetTree.snippetAdded.add( $.proxy(@snippetAdded, this) )
    @snippetTree.snippetRemoved.add( $.proxy(@snippetRemoved, this) )
    @snippetTree.snippetMoved.add( $.proxy(@snippetMoved, this) )
    @snippetTree.snippetContentChanged.add( $.proxy(@snippetContentChanged, this) )
    @snippetTree.snippetHtmlChanged.add( $.proxy(@snippetHtmlChanged, this) )


  snippetAdded: (model) ->
    @insertSnippet(model)


  snippetRemoved: (model) ->
    @removeSnippet(model)
    @deleteCachedSnippetViewForSnippet(model)


  snippetMoved: (model) ->
    @removeSnippet(model)
    @insertSnippet(model)


  snippetContentChanged: (model) ->
    @snippetViewForSnippet(model).updateContent()


  snippetHtmlChanged: (model) ->
    @snippetViewForSnippet(model).updateHtml()


  # Rendering
  # ---------


  snippetViewForSnippet: (model) ->
    @snippetViews[model.id] ||= model.createView(@renderingContainer.isReadOnly)


  deleteCachedSnippetViewForSnippet: (model) ->
    delete @snippetViews[model.id]


  render: ->
    @$root.empty()

    @snippetTree.each (model) =>
      @insertSnippet(model)


  clear: ->
    @snippetTree.each (model) =>
      @snippetViewForSnippet(model).attachedToDom = false

    @$root.empty()


  redraw: ->
    @clear()
    @render()


  insertSnippet: (model) ->
    snippetView = @snippetViewForSnippet(model)
    return if snippetView.attachedToDom

    previous = model.previous
    next = model.next
    parentContainer = model.parentContainer

    if previous? and
      (previousHtml = @snippetViewForSnippet(previous)) and
      previousHtml.attachedToDom
        previousHtml.$html.after(snippetView.$html)
        snippetView.attachedToDom = true
    else if next? and
      (nextHtml = @snippetViewForSnippet(next)) and
      nextHtml.attachedToDom
        nextHtml.$html.before(snippetView.$html)
        snippetView.attachedToDom = true
    else if parentContainer
      @appendToContainer(parentContainer, snippetView)
      snippetView.attachedToDom = true

    snippetView.resetDirectives()
    snippetView.wasAttachedToDom.fire()

    @renderingContainer.snippetViewWasInserted(snippetView)


  appendToContainer: (container, snippetView) ->
    if container.isRoot
      @$root.append(snippetView.$html)
    else
      parentSnippetView = @snippetViewForSnippet(container.parentSnippet)
      @appendToSnippetView(parentSnippetView, container.name, snippetView.$html)


  appendToSnippetView: (snippetView, containerName, $elem) ->
    $container = $(snippetView.directives.get(containerName)?.elem)
    $container.append($elem)


  removeSnippet: (model) ->
    snippetView = @snippetViewForSnippet(model)
    snippetView.attachedToDom = false
    snippetView.$html.detach()

    this


  # UI Inserts
  # ----------

  createInterfaceInjector: (snippetOrContainer) ->
    if snippetOrContainer instanceof SnippetModel
      @createSnippetInterfaceInjector(snippetOrContainer)
    else if snippetOrContainer instanceof SnippetContainer
      @createSnippetContainerInterfaceInjector(snippetOrContainer)


  createSnippetInterfaceInjector: (model) ->
    if model.uiInjector == undefined
      model.uiInjector = new InterfaceInjector
        snippet: model
        renderer: this


  createSnippetContainerInterfaceInjector: (snippetContainer) ->
    if snippetContainer.uiInjector == undefined
      snippetContainer.uiInjector = new InterfaceInjector
        snippetContainer: snippetContainer
        renderer: this


