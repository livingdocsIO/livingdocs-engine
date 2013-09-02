# Document Focus
# --------------
# Manage the snippet or editable that is currently focused
class Focus

  constructor: ->
    @editableNode = undefined
    @snippetView = undefined

    @snippetFocus = $.Callbacks()
    @snippetBlur = $.Callbacks()


  setFocus: (snippetView, editableNode) ->
    if editableNode != @editableNode
      @resetEditable()
      @editableNode = editableNode

    if snippetView != @snippetView
      @resetSnippetView()
      if snippetView
        @snippetView = snippetView
        @snippetFocus.fire(@snippetView)


  # call after browser focus change
  editableFocused: (editableNode, snippetView) ->
    if @editableNode != editableNode
      snippetView ||= dom.findSnippetView(editableNode)
      @setFocus(snippetView, editableNode)


  # call after browser focus change
  editableBlurred: (editableNode) ->
    if @editableNode == editableNode
      @setFocus(@snippetView, undefined)


  # call after click
  snippetFocused: (snippetView) ->
    if @snippetView != snippetView
      @setFocus(snippetView, undefined)


  blur: ->
    @setFocus(undefined, undefined)


  # Private
  # -------

  # @api private
  resetEditable: ->
    if @editableNode
      @editableNode = undefined


  # @api private
  resetSnippetView: ->
    if @snippetView
      previous = @snippetView
      @snippetView = undefined
      @snippetBlur.fire(previous)


