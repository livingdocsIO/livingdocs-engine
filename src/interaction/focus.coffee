dom = require('./dom')
ContainerEvent = require('./container_event')

# Component Focus
# ---------------
# Manage the component or editable that is currently focused
module.exports = class Focus

  constructor: ->
    @editableNode = undefined
    @componentView = undefined

    @componentFocus = $.Callbacks()
    @componentBlur = $.Callbacks()
    @containerFocus = $.Callbacks()
    @containerBlur = $.Callbacks()


  setFocus: (componentView, editableNode) ->
    if editableNode != @editableNode
      @resetEditable()
      @editableNode = editableNode

    if componentView != @componentView
      @resetComponentView()
      if componentView
        @componentView = componentView
        @componentFocus.fire(@componentView)
        @fireContainerEvent(view: @componentView, focus: true)


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
      @fireContainerEvent(view: previous, blur: true)


  fireContainerEvent: ({ view, focus, blur }) ->
    event = new ContainerEvent({ target: view, focus, blur })
    component = view.model
    component.parentContainers (container) =>
      this[event.type].fire(container, event)

