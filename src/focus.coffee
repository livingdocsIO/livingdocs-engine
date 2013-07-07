# Document Focus
# --------------
# Manage the snippet or editable that is currently focused
class Focus

  constructor: ->
    @editableNode = undefined
    @snippet = undefined

    @snippetFocus = $.Callbacks()
    @snippetBlur = $.Callbacks()


  setFocus: (snippet, editableNode) ->
    if editableNode != @editableNode
      @blurEditable()
      @editableNode = editableNode

    if snippet != @snippet
      @blurSnippet()

      @snippet = snippet
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


  # Private
  # -------

  # @api private
  blurEditable: ->
    if @editableNode
      @editableNode = undefined


  # @api private
  blurSnippet: ->
    if @snippet
      previous = @snippet
      @snippet = undefined
      @snippetBlur.fire(previous)


