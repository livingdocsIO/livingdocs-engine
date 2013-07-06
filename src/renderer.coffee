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


  snippetAdded: (snippet) ->
    snippetHtml = @ensureSnippetHtml(snippet)
    @updateDomPosition(snippetHtml)


  snippetRemoved: (snippet) ->
    if snippetHtml = @getSnippetHtml(snippet)
      if snippetHtml.attachedToDom
        @detachFromDom(snippetHtml)
        delete @snippets[snippet.id]


  snippetMoved: (snippet) ->
    snippetHtml = @ensureSnippetHtml(snippet)
    @updateDomPosition(snippetHtml)


  snippetContentChanged: (snippet) ->
    snippetHtml = @ensureSnippetHtml(snippet)
    @insertIntoDom(snippetHtml) if not snippetHtml.attachedToDom
    snippetHtml.updateContent()


  # Rendering
  # ---------

  getSnippetHtml: (snippet) ->
    @snippets[snippet.id] if snippet


  ensureSnippetHtml: (snippet) ->
    return unless snippet
    @snippets[snippet.id] || @createSnippetHtml(snippet)


  # creates a snippetHtml instance for this snippet
  # @api: private
  createSnippetHtml: (snippet) ->
    snippetHtml = snippet.template.createHtml(snippet)
    @snippets[snippet.id] = snippetHtml


  render: ->
    @$root.empty()

    @snippetTree.each (snippet) =>
      snippetHtml = @ensureSnippetHtml(snippet)
      @insertIntoDom(snippetHtml)


  clear: ->
    @snippetTree.each (snippet) ->
      snippetHtml = @getSnippetHtml(snippet)
      snippetHtml?.attachedToDom = false

    @$root.empty()


  redraw: ->
    @clear()
    @render()


  updateDomPosition: (snippetHtml) ->
    @detachFromDom(snippetHtml) if snippetHtml.attachedToDom
    @insertIntoDom(snippetHtml)


  # insert the snippet into the Dom according to its position
  # in the SnippetTree
  insertIntoDom: (snippetHtml) ->
    snippetHtml.attach(this)
    log.error('could not insert snippet into Dom') if not snippetHtml.attachedToDom
    @afterDomInsert(snippetHtml)

    this


  afterDomInsert: (snippetHtml) ->
    # initialize editables
    editableNodes = for name, node of snippetHtml.editables
      node

    @page.editableController.add(editableNodes)


  detachFromDom: (snippetHtml) ->
    snippetHtml.detach()
    this


  # Highlight methods
  # -----------------

  highlightSnippet: (snippet) ->
    if snippetHtml = @getSnippetHtml(snippet)
      snippetHtml.$html.addClass(docClass.snippetHighlight)


  removeSnippetHighlight: (snippet) ->
    if snippetHtml = @getSnippetHtml(snippet)
      snippetHtml.$html.removeClass(docClass.snippetHighlight)


  # UI Inserts
  # ----------

  createInterfaceInjector: (snippetOrContainer) ->
    if snippetOrContainer instanceof Snippet
      @createSnippetInterfaceInjector(snippetOrContainer)
    else if snippetOrContainer instanceof SnippetContainer
      @createSnippetContainerInterfaceInjector(snippetOrContainer)


  createSnippetInterfaceInjector: (snippet) ->
    if snippet.uiInjector == undefined
      snippet.uiInjector = new InterfaceInjector
        snippet: snippet
        renderer: this


  createSnippetContainerInterfaceInjector: (snippetContainer) ->
    if snippetContainer.uiInjector == undefined
      snippetContainer.uiInjector = new InterfaceInjector
        snippetContainer: snippetContainer
        renderer: this


