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
    snippetElem = @ensureSnippetElem(snippet)
    @updateDomPosition(snippetElem)


  snippetRemoved: (snippet) ->
    if snippetElem = @getSnippetElem(snippet)
      if snippetElem.attachedToDom
        @detachFromDom(snippetElem)
        delete @snippets[snippet.id]


  snippetMoved: (snippet) ->
    snippetElem = @ensureSnippetElem(snippet)
    @updateDomPosition(snippetElem)


  snippetContentChanged: (snippet) ->
    snippetElem = @ensureSnippetElem(snippet)
    @insertIntoDom(snippetElem) if not snippetElem.attachedToDom
    snippetElem.updateContent()


  # Rendering
  # ---------

  getSnippetElem: (snippet) ->
    @snippets[snippet.id] if snippet


  ensureSnippetElem: (snippet) ->
    return unless snippet
    @snippets[snippet.id] || @createSnippetElem(snippet)


  # creates a snippetElem instance for this snippet
  # @api: private
  createSnippetElem: (snippet) ->
    snippetElem = snippet.template.createHtml(snippet)
    @snippets[snippet.id] = snippetElem


  render: ->
    @$root.empty()

    @snippetTree.each (snippet) =>
      snippetElem = @ensureSnippetElem(snippet)
      @insertIntoDom(snippetElem)


  clear: ->
    @snippetTree.each (snippet) =>
      snippetElem = @getSnippetElem(snippet)
      snippetElem?.attachedToDom = false

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

  highlightSnippet: (snippet) ->
    if snippetElem = @getSnippetElem(snippet)
      snippetElem.$html.addClass(docClass.snippetHighlight)


  removeSnippetHighlight: (snippet) ->
    if snippetElem = @getSnippetElem(snippet)
      snippetElem.$html.removeClass(docClass.snippetHighlight)


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


