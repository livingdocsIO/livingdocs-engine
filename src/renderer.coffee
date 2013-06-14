class Renderer


  constructor: ({ @snippetTree, rootNode }) ->
    error('no snippet tree specified') if !@snippetTree
    error('no root node specified') if !rootNode

    @$root = $(rootNode)
    @snippetTree.renderer = this
    @setupSnippetTreeListeners()


  # Snippet Tree Event Handling
  # ---------------------------

  setupSnippetTreeListeners: ->
    @snippetTree.snippetAdded.add( $.proxy(this, 'snippetAdded') )
    @snippetTree.snippetRemoved.add( $.proxy(this, 'snippetRemoved') )
    @snippetTree.snippetMoved.add( $.proxy(this, 'snippetMoved') )


  snippetAdded: (snippet) ->
    @ensureSnippetHtml(snippet)
    @updateDomPosition(snippet.snippetHtml)


  snippetRemoved: (snippet) ->
    if snippet.snippetHtml?.attachedToDom
      @detachFromDom(snippet.snippetHtml)


  snippetMoved: (snippet) ->
    @ensureSnippetHtml(snippet)
    @updateDomPosition(snippet.snippetHtml)


  # Rendering
  # ---------

  ensureSnippetHtml: (snippet) ->
    if !snippet.snippetHtml
      snippet.createHtml()


  render: (overwriteContent) ->
    @$root.html('') if overwriteContent
    if @$root.html() == ''
      # render SnippetTree from scratch
      # consider: replace $domNode with a documentFragment and reswap after
      # everything is inserted (but I don't know if this is actually faster)

      @snippetTree.each (snippet) =>
        @ensureSnippetHtml(snippet)
        @insertIntoDom(snippet.snippetHtml)


  clear: ->
    @snippetTree.each (snippet) ->
      snippet.snippetHtml?.attachedToDom = false

    @$root.html('')


  redraw: ->
    @clear()
    @render()


  updateDomPosition: (snippetHtml) ->
    @detachFromDom(snippetHtml) if snippetHtml.attachedToDom
    @insertIntoDom(snippetHtml)


  # insert the snippet into the Dom according to its position
  # in the SnippetTree
  insertIntoDom: (snippetHtml) ->
    snippet = snippetHtml.snippet
    previous = snippet.previous
    next = snippet.next
    parentContainer = snippet.parentContainer
    $snippet = snippetHtml.$html

    unless snippetHtml.attachedToDom

      if previous?.snippetHtml?.attachedToDom
        previous.snippetHtml.$html.after($snippet)
        @afterDomInsert(snippetHtml)
      else if next?.snippetHtml?.attachedToDom
        next.snippetHtml.$html.before($snippet)
        @afterDomInsert(snippetHtml)
      else if parentContainer
        @appendToContainer(parentContainer, $snippet)
        @afterDomInsert(snippetHtml)
      else
        error('could not insert snippet into Dom')

    this


  appendToContainer: (container, $elem) ->
    if container.isRoot
      @$root.append($elem)
    else
      container.parentSnippet.snippetHtml.append(
        container.name,
        $elem
      )


  afterDomInsert: (snippetHtml) ->
    snippetHtml.attachedToDom = true

    # initialize editables
    editableNodes = snippetHtml.$html.findIn("[#{ docAttr.editable }]")
    Editable.add(editableNodes)


  detachFromDom: (snippetHtml) ->
    snippetHtml.detach()
    this


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

