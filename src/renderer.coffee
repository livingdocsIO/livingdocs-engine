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
    @snippetTree.snippetHtmlChanged.add( $.proxy(this, 'snippetHtmlChanged') )


  snippetAdded: (model) ->
    view = @ensureSnippetView(model)
    @updateDomPosition(view)


  snippetRemoved: (model) ->
    if view = @getSnippetView(model)
      if view.attachedToDom
        @detachFromDom(view)
        delete @snippets[model.id]


  snippetMoved: (model) ->
    view = @ensureSnippetView(model)
    @updateDomPosition(view)


  snippetContentChanged: (model) ->
    view = @ensureSnippetView(model)
    @insertIntoDom(view) if not view.attachedToDom
    view.updateContent()


  snippetHtmlChanged: (model) ->
    view = @ensureSnippetView(model)
    @insertIntoDom(view) if not view.attachedToDom
    view.updateHtml()


  # Rendering
  # ---------

  getSnippetView: (model) ->
    @snippets[model.id] if model


  ensureSnippetView: (model) ->
    return unless model
    @snippets[model.id] || @createSnippetView(model)


  # creates a snippetView instance for this snippet
  # @api: private
  createSnippetView: (model) ->
    view = model.template.createView(model)
    @snippets[model.id] = view


  render: ->
    @$root.empty()

    @snippetTree.each (model) =>
      view = @ensureSnippetView(model)
      @insertIntoDom(view)


  clear: ->
    @snippetTree.each (model) =>
      view = @getSnippetView(model)
      view?.attachedToDom = false

    @$root.empty()


  redraw: ->
    @clear()
    @render()


  updateDomPosition: (snippetView) ->
    @detachFromDom(snippetView) if snippetView.attachedToDom
    @insertIntoDom(snippetView)


  # insert the snippet into the Dom according to its position
  # in the SnippetTree
  insertIntoDom: (snippetView) ->
    snippetView.attach(this)
    log.error('could not insert snippet into Dom') if not snippetView.attachedToDom
    @afterDomInsert(snippetView)

    this


  afterDomInsert: (snippetView) ->
    # initialize editables
    editableNodes = for name, node of snippetView.editables
      node

    @page.editableController.add(editableNodes)


  detachFromDom: (snippetView) ->
    snippetView.detach()
    this


  # Highlight methods
  # -----------------

  highlightSnippet: (snippetView) ->
    snippetView.$html.addClass(docClass.snippetHighlight)


  removeSnippetHighlight: (snippetView) ->
    snippetView.$html.removeClass(docClass.snippetHighlight)


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


