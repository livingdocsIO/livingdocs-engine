class Renderer

  constructor: ({ @snippetTree }) ->


  link: (overwriteContent) ->
    $domNode = @snippetTree.root.$domNode = $(rootNode)
    $domNode.html("") if overwriteContent

    if $domNode.html() == ""
      # render SnippetTree from scratch

      # consider: replace $domNode with a documentFragment and reswap after
      # everything is inserted (but I don't know if this is actually faster)

      @snippetTree.each (snippet) ->
        @insertIntoDom(snippet)


  # insert the snippet into the Dom according to its position
  # in the SnippetTree
  insertIntoDom: (snippet) ->
    previous = snippet.previous
    next = snippet.next
    parentContainer = snippet.parentContainer

    if !@attachedToDom
      if previous && previous.attachedToDom
        previous.$snippet.after(@$snippet)
        @afterDomInsert()
      else if next && next.snippet.attachedToDom
        next.$snippet.before(@$snippet)
        @afterDomInsert()
      else if parentContainer
        parentContainer.$domNode.append(@$snippet)
        @afterDomInsert()
      else
        error("could not insert snippet into Dom")

    this #chaining


  # afterSnippetInsert: (snippet) ->
  #   snippet.attachedToDom = true

  #   # initialize editables
  #   editableNodes = snippet.$snippet.findIn("[#{ docAttr.editable }]")
  #   Editable.add(editableNodes)


  # updateDomPosition: (snippet) ->
  #   snippet.detachFromDom() if snippet.attachedToDom
  #   @insertIntoDom(snippet)


  # detachFromDom: (snippet) ->
  #   snippet.$snippet.detach()
  #   snippet.attachedToDom = false
  #   this #chaining


  # removeFromDom: (snippet) ->
  #   if snippet.attachedToDom
  #     snippet.attachedToDom = false
  #     snippet.$snippet.remove()

  #   this #chaining


