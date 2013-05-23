# Document Focus
# --------------
# Manage the snippet or editable that is currently focused

focus = do ->

  editableNode: undefined
  snippet: undefined

  snippetFocus: $.Callbacks()
  snippetBlur: $.Callbacks()

  _blurEditable: () ->
    if @editableNode
      @editableNode = undefined


  _blurSnippet: () ->
    if @snippet
      @removeHighlight(@snippet)

      previous = @snippet
      @snippet = undefined
      @snippetBlur.fire(previous)


  setFocus: (snippet, editableNode) ->
    if editableNode != @editableNode
      @_blurEditable()
      @editableNode = editableNode

    if snippet != @snippet
      @_blurSnippet()

      @snippet = snippet
      @highlightSnippet()
      @snippetFocus.fire(@snippet)


  # call after browser focus change
  editableFocused: (editableNode) ->
    if @editableNode != editableNode
      snippet = dom.parentSnippet(editableNode)
      @setFocus(snippet, editableNode)


  # call after browser focus change
  editableBlurred: (editableNode) ->
    if @editableNode == editableNode
      @setFocus(@snippet, undefined)


  # call after click
  snippetFocused: (snippet) ->
    if @snippet != snippet
      @setFocus(snippet, undefined)


  blur: () ->
    @setFocus(undefined, undefined)


  # Highlight methods
  # -----------------

  highlightSnippet: () ->
    if @snippet
      @snippet.$snippet.addClass(docClass.snippetHighlight)


  removeHighlight: (snippet) ->
    snippet.$snippet.removeClass(docClass.snippetHighlight)





