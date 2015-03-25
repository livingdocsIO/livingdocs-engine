config = require('../configuration/config')
Page = require('./page')
dom = require('../interaction/dom')
Focus = require('../interaction/focus')
EditableController = require('../interaction/editable_controller')
DragBase = require('../interaction/drag_base')
ComponentDrag = require('../interaction/component_drag')

# An InteractivePage is a subclass of Page which allows for manipulation of the
# rendered ComponentTree.
module.exports = class InteractivePage extends Page

  LEFT_MOUSE_BUTTON = 1

  isReadOnly: false


  constructor: ({ renderNode, hostWindow }={}) ->
    super

    @focus = new Focus()
    @editableController = new EditableController(this)

    # events
    @imageClick = $.Callbacks() # (componentView, fieldName, event) ->
    @htmlElementClick = $.Callbacks() # (componentView, fieldName, event) ->
    @linkClick = $.Callbacks() # (componentView, fieldName, event) ->
    @componentWillBeDragged = $.Callbacks() # (componentModel) ->
    @componentWasDropped = $.Callbacks() # (componentModel) ->
    @dragBase = new DragBase(this)
    @focus.componentFocus.add( $.proxy(@afterComponentFocused, this) )
    @focus.componentBlur.add( $.proxy(@afterComponentBlurred, this) )
    @beforeInteractivePageReady()
    @$document
      .on('mousedown.livingdocs', $.proxy(@mousedown, this))
      .on('click.livingdocs', $.proxy(@click, this))
      .on('touchstart.livingdocs', $.proxy(@mousedown, this))
      .on('dragstart.livingdocs', $.proxy(@browserDragStart, this))


  beforeInteractivePageReady: ->
    if config.livingdocsCssFile && @loadResources
      @assets.cssLoader.loadSingleUrl(config.livingdocsCssFile, @readySemaphore.wait())


  # prevent the browser Drag&Drop from interfering
  browserDragStart: (event) ->
    event.preventDefault()
    event.stopPropagation()


  removeListeners: ->
    @$document.off('.livingdocs')
    @$document.off('.livingdocs-drag')


  mousedown: (event) ->
    return if event.which != LEFT_MOUSE_BUTTON && event.type == 'mousedown' # only respond to left mouse button

    # Ignore interactions on certain elements
    isControl = $(event.target).closest(config.ignoreInteraction).length
    return if isControl

    # Identify the clicked component
    componentView = dom.findComponentView(event.target)

    # This is called in mousedown since editables get focus on mousedown
    # and only before the editables clear their placeholder can we safely
    # identify where the user has clicked.
    @handleClickedComponent(event, componentView)

    if componentView
      @startDrag
        componentView: componentView
        event: event


  # Prevent doc-links from changing the location
  click: (event) ->
    target = event.target
    if dom.isInsideDocLink(target)
      event.preventDefault()


  startDrag: ({ componentModel, componentView, event, config }) ->
    return unless componentModel || componentView
    componentModel = componentView.model if componentView

    componentDrag = new ComponentDrag
      componentModel: componentModel
      componentView: componentView

    config ?=
      longpress:
        showIndicator: true
        delay: 400
        tolerance: 3

    @dragBase.init(componentDrag, event, config)


  cancelDrag: ->
    @dragBase.cancel()


  handleClickedComponent: (event, componentView) ->
    if componentView
      @focus.componentFocused(componentView)

      directives = dom.getDirectiveContext(event.target)
      if directives?
        if directives['image']
          @imageClick.fire(componentView, directives['image'].name, event)
        else if directives['link']
          @linkClick.fire(componentView, directives['link'].name, event)
        else if directives['html']
          @htmlElementClick.fire(componentView, directives['html'].name, event)
    else
      @focus.blur()


  getFocusedElement: ->
    @window.document.activeElement


  blurFocusedElement: ->
    @focus.setFocus(undefined)
    focusedElement = @getFocusedElement()
    $(focusedElement).blur() if focusedElement


  componentViewWasInserted: (componentView) ->
    @initializeEditables(componentView)


  initializeEditables: (componentView) ->
    if componentView.directives.editable
      editableNodes = for directive in componentView.directives.editable
        directive.elem

      @editableController.add(editableNodes)


  afterComponentFocused: (componentView) ->
    componentView.afterFocused()


  afterComponentBlurred: (componentView) ->
    componentView.afterBlurred()
