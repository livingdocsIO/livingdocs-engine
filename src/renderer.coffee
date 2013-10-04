class Renderer


  constructor: ({ @snippetTree, @page, readOnly }) ->
    assert @snippetTree, 'no snippet tree specified'
    assert @page, 'no page specified'
    assert @page.renderNode, 'page does not specify a node to render to'

    @$root = $(@page.renderNode)
    @setupPageListeners()
    @setupSnippetTreeListeners()
    @snippets = {}

    @readOnly = Boolean(readOnly)
    @page.setInteractive(!@readOnly)


  # Snippet Tree Event Handling
  # ---------------------------

  setupPageListeners: ->
    @page.focus.snippetFocus.add( $.proxy(@highlightSnippet, this) )
    @page.focus.snippetBlur.add( $.proxy(@removeSnippetHighlight, this) )


  setupSnippetTreeListeners: ->
    @snippetTree.snippetAdded.add( $.proxy(@snippetAdded, this) )
    @snippetTree.snippetRemoved.add( $.proxy(@snippetRemoved, this) )
    @snippetTree.snippetMoved.add( $.proxy(@snippetMoved, this) )
    @snippetTree.snippetContentChanged.add( $.proxy(@snippetContentChanged, this) )
    @snippetTree.snippetHtmlChanged.add( $.proxy(@snippetHtmlChanged, this) )


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
    @page.blurFocusedElement()
    @snippetTree.each (model) =>
      view = @getSnippetView(model)
      view?.attachedToDom = false

    @snippets = {}
    @$root.empty()


  redraw: ->
    @clear()
    @render()


  setReadOnly: (readOnly) ->
    return unless readOnly?

    readOnly = Boolean(readOnly)

    if readOnly != @readOnly
      @readOnly = readOnly
      @page.setInteractive(!readOnly)
      @redraw()


  updateDomPosition: (snippetView) ->
    @detachFromDom(snippetView) if snippetView.attachedToDom
    @insertIntoDom(snippetView)


  # insert the snippet into the Dom according to its position
  # in the SnippetTree
  insertIntoDom: (snippetView) ->
    snippetView.attach(this)
    assert snippetView.attachedToDom, 'could not insert snippet into Dom'
    @afterDomInsert(snippetView)

    this


  afterDomInsert: (snippetView) ->
    @initializeEditables(snippetView) unless @readOnly


  initializeEditables: (snippetView) ->
    if snippetView.directives.editable
      editableNodes = for directive in snippetView.directives.editable
        directive.elem

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


