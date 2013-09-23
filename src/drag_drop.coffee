# DragDrop
#
# to start a drag operation:
# aDragdropInstance.mousedown(...)
#
# options that can be set when creating an instance or overwritten for every drag (applicable in mousedown call)
# @option direct: if true the specified element itself is moved while dragging, otherwise a semi-transparent clone is created
#
# long press:
# @option longpressDelay: miliseconds that the mouse needs to be pressed before drag initiates
# @option longpressDistanceLimit: if the pointer is moved by more pixels during the longpressDelay the drag operation is aborted
#
# click friendly:
# @option minDistance: drag is initialized only if the pointer is moved by a minimal distance
# @option preventDefault: call preventDefault on mousedown (prevents browser drag & drop)
#
# options for a single drag (pass directly to mousedown call)
# @option drag.fixed: set to true for position: fixed elements
# @option drag.mouseToSnippet: e.g. { left: 20, top: 20 }, force position of dragged element relative to cursor
# @option drag.width: e.g. 300, force width of dragged element
# @option drag.onDrop: callback( dragObj, $origin ), will be called after the node is dropped
# @option drag.onDrag: callback( tragTarget, dragObj ), will be called after the node is dropped
# @option drag.onDragStart: callback( dragObj ), will be called after the drag started

class DragDrop

  constructor: (options) ->

    @defaultOptions = $.extend({
        longpressDelay: 0
        longpressDistanceLimit: 10
        minDistance: 0
        direct: false
        preventDefault: true
        createPlaceholder: DragDrop.placeholder
        scrollNearEdge: 50
      }, options)

    # per drag properties
    @drag = {}

    @$origin = undefined
    @$dragged = undefined


  # start a possible drag
  # the drag is only really started if constraints are not violated (longpressDelay and longpressDistanceLimit or minDistance)
  mousedown: ($origin, event, options = {}) ->
    @reset()
    @drag.initialized = true
    @options = $.extend({}, @defaultOptions, options)
    if event.type == 'touchstart'
      @drag.startPoint =
        left: event.originalEvent.changedTouches[0].pageX
        top: event.originalEvent.changedTouches[0].pageY
    else
      @drag.startPoint = { left: event.pageX, top: event.pageY }
    @$origin = $origin

    if @options.longpressDelay and @options.longpressDistanceLimit
      @drag.timeout = setTimeout( =>
        @start()
      , @options.longpressDelay)

    # prevent browser Drag & Drop
    event.preventDefault() if @options.preventDefault


  # start the drag process
  start: ->
    @drag.started = true

    mouseLeft = @drag.startPoint.left
    mouseTop = @drag.startPoint.top

    if typeof @options.onDragStart == 'function'
        @options.onDragStart.call(this, @drag, { left: mouseLeft, top: mouseTop })

    # prevent text-selections while dragging
    $(window.document.body).addClass(docClass.preventSelection)

    if @options.direct
      @$dragged = @$origin
    else
      @$dragged = @options.createPlaceholder(@drag, @$origin)

    if @drag.fixed
      @drag.$body = $(window.document.body)

    # positionDragged
    @move(mouseLeft, mouseTop)

    if !@direct
      @$dragged.appendTo(window.document.body).show()
      @$origin?.addClass(docClass.dragged)


  # only vertical scrolling
  scrollIntoView: (top, event) ->
    if @lastScrollPosition
      delta = top - @lastScrollPosition
      viewportTop = $(window).scrollTop()
      viewportBottom = viewportTop + $(window).height()

      shouldScroll =
        if delta < 0 # upward movement
          inScrollUpArea = top < viewportTop + @defaultOptions.scrollNearEdge
          viewportTop != 0 && inScrollUpArea
        else # downward movement
          abovePageBottom = viewportBottom - $(window).height() < ($(window.document).height())
          inScrollDownArea = top > viewportBottom - @defaultOptions.scrollNearEdge
          abovePageBottom && inScrollDownArea

      window.scrollBy(0, delta) if shouldScroll

    @lastScrollPosition = top


  move: (mouseLeft, mouseTop, event) ->
    if @drag.started
      if @drag.mouseToSnippet
        left = mouseLeft - @drag.mouseToSnippet.left
        top = mouseTop - @drag.mouseToSnippet.top
      else
        left = mouseLeft
        top = mouseTop

      if @drag.fixed
        top = top - @drag.$body.scrollTop()
        left = left - @drag.$body.scrollLeft()

      left = 2 if left < 2
      top = 2 if top < 2

      @$dragged.css({ position:'absolute', left:"#{ left }px", top:"#{ top }px" })
      @scrollIntoView(top, event)
      @dropTarget(mouseLeft, mouseTop, event) if !@direct

    else if @drag.initialized

      # long press measurement of mouse movement prior to drag initialization
      if @options.longpressDelay and @options.longpressDistanceLimit
        @reset() if @distance({ left: mouseLeft, top: mouseTop }, @drag.startPoint) > @options.longpressDistanceLimit

      # delayed initialization after mouse moved a minimal distance
      if @options.minDistance && @distance({ left: mouseLeft, top: mouseTop }, @drag.startPoint) > @options.minDistance
        @start()


  drop: () ->
    if @drag.started

      # drag specific callback
      if typeof @options.onDrop == 'function'
        @options.onDrop.call(this, @drag, @$origin)

    @reset()


  dropTarget: (mouseLeft, mouseTop, event) ->
    if @$dragged && event
      elem = undefined
      if event.type == 'touchstart' || event.type == 'touchmove'
        x = event.originalEvent.changedTouches[0].clientX
        y = event.originalEvent.changedTouches[0].clientY
      else
        x = event.clientX
        y = event.clientY

      # get the element we're currently hovering
      if x && y
        @$dragged.hide()
        # todo: Safari 4 and Opera 10.10 need pageX/Y.
        elem = window.document.elementFromPoint(x, y)
        @$dragged.show()

      # check if a drop is possible
      if elem
        dragTarget = dom.dropTarget(elem, { top: mouseTop, left: mouseLeft })
        @drag.target = dragTarget
      else
        @drag.target = {}

      if typeof @options.onDrag == 'function'
        @options.onDrag.call(this, @drag.target, @drag, { left: mouseLeft, top: mouseTop })


  distance: (pointA, pointB) ->
    return undefined if !pointA || !pointB

    distX = pointA.left - pointB.left
    distY = pointA.top - pointB.top
    Math.sqrt( (distX * distX) + (distY * distY) )


  reset: ->
    if @drag.initialized
      clearTimeout(@drag.timeout) if @drag.timeout
      @drag.preview.remove() if @drag.preview

      if @$dragged and @$dragged != @$origin
        @$dragged.remove()

      if @$origin
        @$origin.removeClass(docClass.dragged)
        @$origin.show()

      $(window.document.body).removeClass(docClass.preventSelection)

      @drag = {}
      @$origin = undefined
      @$dragged = undefined


# Drag preview method -> these are set in the configuration and can be replaced
DragDrop.cloneOrigin = (drag, $origin) ->

  # calculate mouse position relative to snippet
  if !drag.mouseToSnippet
    snippetOffset = $origin.offset()
    marginTop = parseFloat( $origin.css("margin-top") )
    marginLeft = parseFloat( $origin.css("margin-left") )
    drag.mouseToSnippet =
      left: (mouseLeft - snippetOffset.left + marginLeft)
      top: (mouseTop - snippetOffset.top + marginTop)

  # clone snippet
  snippetWidth = drag.width || $origin.width()
  draggedCopy = $origin.clone()

  draggedCopy.css({ position: "absolute", width: snippetWidth })
    .removeClass(docClass.snippetHighlight)
    .addClass(docClass.draggedPlaceholder)

  # set white background on transparent elements
  backgroundColor = $origin.css("background-color")
  hasBackgroundColor = backgroundColor != "transparent" && backgroundColor != "rgba(0, 0, 0, 0)"
  # backgroundSetting = @$origin.css("background") || @$origin.css("background-color")

  if !hasBackgroundColor
    draggedCopy.css({ "background-color": "#fff"})

  return draggedCopy


DragDrop.placeholder = (drag) ->
  snippetWidth = drag.width
  numberOfDraggedElems = 1
  if !drag.mouseToSnippet
    drag.mouseToSnippet =
      left: 2
      top: -15

  template =
    """
    <div class="doc-drag-placeholder-item">
      <span class="doc-drag-counter">#{ numberOfDraggedElems }</span>
      Selected Item
    </div>
    """

  $placeholder = $(template)
  $placeholder.css(width: snippetWidth) if snippetWidth
  $placeholder.css(position: "absolute")



