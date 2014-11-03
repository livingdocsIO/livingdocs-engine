dom = require('./dom')

# Component Focus
# ---------------
# Manage the snippet or editable that is currently focused
module.exports = class Focus

  constructor: ->
    @editableNode = undefined
    @componentView = undefined

    @snippetFocus = $.Callbacks()
    @snippetBlur = $.Callbacks()


  setFocus: (componentView, editableNode) ->
    if editableNode != @editableNode
      @resetEditable()
      @editableNode = editableNode

    if componentView != @componentView
      @resetSnippetView()
      if componentView
        @componentView = componentView
        @snippetFocus.fire(@componentView)


  # call after browser focus change
  editableFocused: (editableNode, componentView) ->
    if @editableNode != editableNode
      componentView ||= dom.findSnippetView(editableNode)
      @setFocus(componentView, editableNode)


  # call after browser focus change
  editableBlurred: (editableNode) ->
    if @editableNode == editableNode
      @setFocus(@componentView, undefined)


  # call after click
  snippetFocused: (componentView) ->
    if @componentView != componentView
      @setFocus(componentView, undefined)


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
    if @componentView
      previous = @componentView
      @componentView = undefined
      @snippetBlur.fire(previous)


