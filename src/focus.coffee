# Document Focus
# --------------
# Manage the snippet or editable that is currently focused
focus = do ->

  editableNode: undefined
  snippet: undefined

  snippetFocus: $.Callbacks()
  snippetBlur: $.Callbacks()


  setFocus: (snippet, editableNode) ->
    if editableNode != @editableNode
      @blurEditable()
      @editableNode = editableNode

    if snippet != @snippet
      @blurSnippet()

      @snippet = snippet
      @highlightSnippet()
      @snippetFocus.fire(@snippet)


  # call after browser focus change
  editableFocused: (editableNode, snippet) ->
    if @editableNode != editableNode
      snippet ||= dom.parentSnippet(editableNode)
      @setFocus(snippet, editableNode)


  # call after browser focus change
  editableBlurred: (editableNode, snippet) ->
    if @editableNode == editableNode
      @setFocus(@snippet, undefined)


  # call after click
  snippetFocused: (snippet) ->
    if @snippet != snippet
      @setFocus(snippet, undefined)


  blur: ->
    @setFocus(undefined, undefined)


  # Highlight methods
  # -----------------

  highlightSnippet: ->
    if @snippet?.snippetHtml
      @snippet.snippetHtml.$html.addClass(docClass.snippetHighlight)


  removeHighlight: (snippet) ->
    if snippet?.snippetHtml
      snippet.snippetHtml.$html.removeClass(docClass.snippetHighlight)


  # Private
  # -------

  # @api private
  blurEditable: ->
    if @editableNode
      @editableNode = undefined


  # @api private
  blurSnippet: ->
    if @snippet
      @removeHighlight(@snippet)

      previous = @snippet
      @snippet = undefined
      @snippetBlur.fire(previous)


