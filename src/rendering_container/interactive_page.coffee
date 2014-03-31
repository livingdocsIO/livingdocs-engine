config = require('../configuration/defaults')
Page = require('./page')
dom = require('../interaction/dom')
Focus = require('../interaction/focus')
EditableController = require('../interaction/editable_controller')
DragBase = require('../interaction/drag_base')
SnippetDrag = require('../interaction/snippet_drag')

# An InteractivePage is a subclass of Page which allows for manipulation of the
# rendered SnippetTree.
module.exports = class InteractivePage extends Page

  LEFT_MOUSE_BUTTON = 1

  isReadOnly: false


  constructor: ({ renderNode, hostWindow }={}) ->
    super

    @focus = new Focus()
    @editableController = new EditableController(this)

    # events
    @imageClick = $.Callbacks() # (snippetView, fieldName, event) ->
    @htmlElementClick = $.Callbacks() # (snippetView, fieldName, event) ->
    @snippetWillBeDragged = $.Callbacks() # (snippetModel) ->
    @snippetWasDropped = $.Callbacks() # (snippetModel) ->
    @dragBase = new DragBase(this)
    @focus.snippetFocus.add( $.proxy(@afterSnippetFocused, this) )
    @focus.snippetBlur.add( $.proxy(@afterSnippetBlurred, this) )
    @beforeInteractivePageReady()

    @$document
      .on('click.livingdocs', $.proxy(@click, this))
      .on('mousedown.livingdocs', $.proxy(@mousedown, this))
      .on('touchstart.livingdocs', $.proxy(@mousedown, this))
      .on('dragstart', $.proxy(@browserDragStart, this))


  beforeInteractivePageReady: ->
    if config.livingdocsCssFile?
      @cssLoader.load(config.livingdocsCssFile, @readySemaphore.wait())


  # prevent the browser Drag&Drop from interfering
  browserDragStart: (event) ->
    event.preventDefault()
    event.stopPropagation()


  removeListeners: ->
    @$document.off('.livingdocs')
    @$document.off('.livingdocs-drag')


  mousedown: (event) ->
    return if event.which != LEFT_MOUSE_BUTTON && event.type == 'mousedown' # only respond to left mouse button
    snippetView = dom.findSnippetView(event.target)
    return unless snippetView

    @startDrag
      snippetView: snippetView
      event: event


  startDrag: ({ snippetModel, snippetView, event, config }) ->
    return unless snippetModel || snippetView
    snippetModel = snippetView.model if snippetView

    snippetDrag = new SnippetDrag
      snippetModel: snippetModel
      snippetView: snippetView

    config ?=
      longpress:
        showIndicator: true
        delay: 400
        tolerance: 3

    @dragBase.init(snippetDrag, event, config)


  click: (event) ->
    snippetView = dom.findSnippetView(event.target)
    nodeContext = dom.findNodeContext(event.target)

    # todo: if a user clicked on a margin of a snippet it should
    # still get selected. (if a snippet is found by parentSnippet
    # and that snippet has no children we do not need to search)

    # if snippet hasChildren, make sure we didn't want to select
    # a child

    # if no snippet was selected check if the user was not clicking
    # on a margin of a snippet

    # todo: check if the click was meant for a snippet container
    if snippetView
      @focus.snippetFocused(snippetView)

      if nodeContext
        switch nodeContext.contextAttr
          when config.directives.image.renderedAttr
            @imageClick.fire(snippetView, nodeContext.attrName, event)
          when config.directives.html.renderedAttr
            @htmlElementClick.fire(snippetView, nodeContext.attrName, event)
    else
      @focus.blur()


  getFocusedElement: ->
    window.document.activeElement


  blurFocusedElement: ->
    @focus.setFocus(undefined)
    focusedElement = @getFocusedElement()
    $(focusedElement).blur() if focusedElement


  snippetViewWasInserted: (snippetView) ->
    @initializeEditables(snippetView)


  initializeEditables: (snippetView) ->
    if snippetView.directives.editable
      editableNodes = for directive in snippetView.directives.editable
        directive.elem

      @editableController.add(editableNodes)


  afterSnippetFocused: (snippetView) ->
    snippetView.afterFocused()


  afterSnippetBlurred: (snippetView) ->
    snippetView.afterBlurred()
