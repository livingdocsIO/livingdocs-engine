# page
# ----
# Defines the API between the DOM and the document
class Page

  LEFT_MOUSE_BUTTON = 1

  constructor: (renderNode) ->
    @document = window.document
    @$document = $(@document)
    @$body = $(@document.body)
    @renderNode = renderNode || $(".#{ docClass.section }")[0]

    @loader = new Loader()
    @focus = new Focus()
    @editableController = new EditableController(this)

    # events
    @imageClick = $.Callbacks() # (snippetView, fieldName, event) ->
    @htmlElementClick = $.Callbacks() # (snippetView, fieldName, event) ->
    @snippetWillBeDragged = $.Callbacks() # (snippetModel) ->
    @snippetWasDropped = $.Callbacks() # (snippetModel) ->

    @snippetDragDrop = new DragDrop
      longpressDelay: 400
      longpressDistanceLimit: 10
      preventDefault: false

    @$document
      .on('click.livingdocs', $.proxy(@click, this))
      .on('mousedown.livingdocs', $.proxy(@mousedown, this))
      .on('touchstart.livingdocs', $.proxy(@mousedown, this))
      .on('dragstart', $.proxy(@browserDragStart, this))


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

    if snippetView
      @startDrag
        snippetView: snippetView
        dragDrop: @snippetDragDrop
        event: event


  # These events are initialized immediately to allow a long-press finish
  registerDragStopEvents: (dragDrop, event) ->
    eventNames =
      if event.type == 'touchstart'
        'touchend.livingdocs-drag touchcancel.livingdocs-drag touchleave.livingdocs-drag'
      else
        'mouseup.livingdocs-drag'
    @$document.on eventNames, =>
      dragDrop.drop()
      @$document.off('.livingdocs-drag')


  # These events are possibly initialized with a delay in snippetDrag#onStart
  registerDragMoveEvents: (dragDrop, event) ->
    if event.type == 'touchstart'
      @$document.on 'touchmove.livingdocs-drag', (event) ->
        event.preventDefault()
        dragDrop.move(event.originalEvent.changedTouches[0].pageX, event.originalEvent.changedTouches[0].pageY, event)

    else # all other input devices behave like a mouse
      @$document.on 'mousemove.livingdocs-drag', (event) ->
        dragDrop.move(event.pageX, event.pageY, event)


  startDrag: ({ snippet, snippetView, dragDrop, event }) ->
    return unless snippet || snippetView
    snippet = snippetView.model if snippetView

    @registerDragMoveEvents(dragDrop, event)
    @registerDragStopEvents(dragDrop, event)
    snippetDrag = new SnippetDrag({ snippet: snippet, page: this })

    $snippet = snippetView.$html if snippetView
    dragDrop.mousedown $snippet, event,
      onDragStart: snippetDrag.onStart
      onDrag: snippetDrag.onDrag
      onDrop: snippetDrag.onDrop


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
