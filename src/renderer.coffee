class Renderer

  constructor: ({ @snippetTree, rootNode }) ->
    error("no snippet tree specified") if !@snippetTree
    error("no root node specified") if !rootNode

    @$root = $(rootNode)
    @setupSnippetTreeListeners()


  # Snippet Tree Event Handling
  # ---------------------------

  setupSnippetTreeListeners: () ->
    @snippetTree.snippetAdded.add( $.proxy(this, "snippetAdded") )
    @snippetTree.snippetRemoved.add( $.proxy(this, "snippetRemoved") )
    @snippetTree.snippetMoved.add( $.proxy(this, "snippetMoved") )


  snippetAdded: (snippet) ->
    @updateDomPosition(snippet)


  snippetRemoved: (snippet) ->
    @detachFromDom(snippet) if snippet.attachedToDom


  snippetMoved: (snippet) ->
    @updateDomPosition(snippet)


  # Rendering
  # ---------

  render: (overwriteContent) ->
    @$root.html("") if overwriteContent
    if @$root.html() == ""
      # render SnippetTree from scratch
      # consider: replace $domNode with a documentFragment and reswap after
      # everything is inserted (but I don't know if this is actually faster)

      @snippetTree.each (snippet) ->
        @insertIntoDom(snippet)


  remove: () ->
    @snippetTree.each (snippet) ->
      snippet.attachedToDom = false

    @$root.html("")


  updateDomPosition: (snippet) ->
    @detachFromDom(snippet) if snippet.attachedToDom
    @insertIntoDom(snippet)


  # insert the snippet into the Dom according to its position
  # in the SnippetTree
  insertIntoDom: (snippet) ->
    previous = snippet.previous
    next = snippet.next
    parentContainer = snippet.parentContainer
    attachedToDom = snippet.attachedToDom
    $snippet = snippet.$snippet

    if !attachedToDom
      if previous && previous.attachedToDom
        previous.$snippet.after($snippet)
        @afterDomInsert(snippet)
      else if next && next.attachedToDom
        next.$snippet.before($snippet)
        @afterDomInsert(snippet)
      else if parentContainer
        if parentContainer.isRoot
          @$root.append($snippet)
        else
          parentContainer.$domNode.append($snippet)
        @afterDomInsert(snippet)
      else
        error("could not insert snippet into Dom")

    this #chaining


  afterDomInsert: (snippet) ->
    snippet.attachedToDom = true

    # initialize editables
    editableNodes = snippet.$snippet.findIn("[#{ docAttr.editable }]")
    Editable.add(editableNodes)


  detachFromDom: (snippet) ->
    snippet.$snippet.detach()
    snippet.attachedToDom = false
    this #chaining


  # removeFromDom: (snippet) ->
  #   if snippet.attachedToDom
  #     snippet.attachedToDom = false
  #     snippet.$snippet.remove()

  #   this #chaining


