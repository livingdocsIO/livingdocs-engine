class Renderer


  constructor: ({ @snippetTree, rootNode, @page }) ->
    log.error('no snippet tree specified') if !@snippetTree
    log.error('no root node specified') if !rootNode

    @$root = $(rootNode)
    @setupPageListeners()
    @setupSnippetTreeListeners()
    @snippets = {}

    # focus

  # Snippet Tree Event Handling
  # ---------------------------

  setupPageListeners: ->
    @page.focus.snippetFocus.add( $.proxy(this, 'highlightSnippet') )
    @page.focus.snippetBlur.add( $.proxy(this, 'removeSnippetHighlight') )


  setupSnippetTreeListeners: ->
    @snippetTree.snippetAdded.add( $.proxy(this, 'snippetAdded') )
    @snippetTree.snippetRemoved.add( $.proxy(this, 'snippetRemoved') )
    @snippetTree.snippetMoved.add( $.proxy(this, 'snippetMoved') )
    @snippetTree.snippetContentChanged.add( $.proxy(this, 'snippetContentChanged') )


  snippetAdded: (model) ->
    view = @ensureSnippetElem(model)
    @updateDomPosition(view)


  snippetRemoved: (model) ->
    if view = @getSnippetElem(model)
      if view.attachedToDom
        @detachFromDom(view)
        delete @snippets[model.id]


  snippetMoved: (model) ->
    view = @ensureSnippetElem(model)
    @updateDomPosition(view)


  snippetContentChanged: (model) ->
    view = @ensureSnippetElem(model)
    @insertIntoDom(view) if not view.attachedToDom
    view.updateContent()


  # Rendering
  # ---------

  getSnippetElem: (model) ->
    @snippets[model.id] if model


  ensureSnippetElem: (model) ->
    return unless model
    @snippets[model.id] || @createSnippetElem(model)


  # creates a snippetElem instance for this snippet
  # @api: private
  createSnippetElem: (model) ->
    view = model.template.createView(model)
    @snippets[model.id] = view


  render: ->
    @$root.empty()

    @snippetTree.each (model) =>
      view = @ensureSnippetElem(model)
      @insertIntoDom(view)


  clear: ->
    @snippetTree.each (model) =>
      view = @getSnippetElem(model)
      view?.attachedToDom = false

    @$root.empty()


  redraw: ->
    @clear()
    @render()


  updateDomPosition: (snippetElem) ->
    @detachFromDom(snippetElem) if snippetElem.attachedToDom
    @insertIntoDom(snippetElem)


  # insert the snippet into the Dom according to its position
  # in the SnippetTree
  insertIntoDom: (snippetElem) ->
    snippetElem.attach(this)
    log.error('could not insert snippet into Dom') if not snippetElem.attachedToDom
    @afterDomInsert(snippetElem)

    this


  afterDomInsert: (snippetElem) ->
    # initialize editables
    editableNodes = for name, node of snippetElem.editables
      node

    @page.editableController.add(editableNodes)


  detachFromDom: (snippetElem) ->
    snippetElem.detach()
    this


  # Highlight methods
  # -----------------

  highlightSnippet: (snippetElem) ->
    snippetElem.$html.addClass(docClass.snippetHighlight)


  removeSnippetHighlight: (snippetElem) ->
    snippetElem.$html.removeClass(docClass.snippetHighlight)


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


