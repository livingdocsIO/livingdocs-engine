class Renderer


  constructor: ({ @snippetTree, rootNode }) ->
    error('no snippet tree specified') if !@snippetTree
    error('no root node specified') if !rootNode

    @$root = $(rootNode)
    @setupSnippetTreeListeners()


  # Snippet Tree Event Handling
  # ---------------------------

  setupSnippetTreeListeners: () ->
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

      @snippetTree.each (snippet) ->
        @ensureSnippetHtml(snippet)
        @insertIntoDom(snippet.snippetHtml)


  remove: () ->
    @snippetTree.each (snippet) ->
      snippet.snippetHtml?.attachedToDom = false

    @$root.html('')


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
        if parentContainer.isRoot
          @$root.append($snippet)
        else
          snippet.getParent().snippetHtml.append(
            parentContainer.name,
            snippetHtml
          )
        @afterDomInsert(snippetHtml)
      else
        error('could not insert snippet into Dom')

    this


  afterDomInsert: (snippetHtml) ->
    snippetHtml.attachedToDom = true

    # initialize editables
    editableNodes = snippetHtml.$html.findIn("[#{ docAttr.editable }]")
    Editable.add(editableNodes)


  detachFromDom: (snippetHtml) ->
    snippetHtml.detach()
    this

