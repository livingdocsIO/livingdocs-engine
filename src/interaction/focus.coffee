dom = require('./dom')

# Component Focus
# ---------------
# Manage the component or editable that is currently focused
module.exports = class Focus

  constructor: ->
    @editableNode = undefined
    @componentView = undefined

    @componentFocus = $.Callbacks()
    @componentBlur = $.Callbacks()


  setFocus: (componentView, editableNode) ->
    if editableNode != @editableNode
      @resetEditable()
      @editableNode = editableNode

    if componentView != @componentView
      @resetComponentView()
      if componentView
        @componentView = componentView
        @componentFocus.fire(@componentView)


  # call after browser focus change
  editableFocused: (editableNode, componentView) ->
    if @editableNode != editableNode
      componentView ||= dom.findComponentView(editableNode)
      @setFocus(componentView, editableNode)


  # call after browser focus change
  editableBlurred: (editableNode) ->
    if @editableNode == editableNode
      @setFocus(@componentView, undefined)


  # call after click
  componentFocused: (componentView) ->
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
  resetComponentView: ->
    if @componentView
      previous = @componentView
      @componentView = undefined
      @componentBlur.fire(previous)


