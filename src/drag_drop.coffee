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

class DragDrop

  constructor: (options) ->

    @defaultOptions = $.extend({
        longpressDelay: 0
        longpressDistanceLimit: 10
        minDistance: 0
        direct: false
        preventDefault: true
        createPlaceholder: DragDrop.placeholder
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
    page.blurFocusedElement()

    mouseLeft = @drag.startPoint.left
    mouseTop = @drag.startPoint.top

    # prevent text-selections while dragging
    $(window.document.body).addClass(docClass.preventSelection)

    # calculate mouse position relative to snippet
    if !@drag.mouseToSnippet
      snippetOffset = @$origin.offset()
      marginTop = parseFloat( @$origin.css("margin-top") )
      marginLeft = parseFloat( @$origin.css("margin-left") )
      @drag.mouseToSnippet =
        left: (mouseLeft - snippetOffset.left + marginLeft)
        top: (mouseTop - snippetOffset.top + marginTop)

    if @options.direct
      @$dragged = @$origin
    else
      @drag.preview = $("<div class='upfront-drag-preview'>")
      $(window.document.body).append(@drag.preview)
      @$dragged = @options.createPlaceholder(@drag, @$origin)

    if @drag.fixed
      @drag.$body = $(window.document.body)

    @drag.started = true

    # positionDragged
    @move(mouseLeft, mouseTop)

    if !@direct
      @$dragged.appendTo(window.document.body).show()
      @$origin.addClass(docClass.dragged)


  move: (mouseLeft, mouseTop, event) ->
    if @drag.started
      left = mouseLeft - @drag.mouseToSnippet.left
      top = mouseTop - @drag.mouseToSnippet.top

      if @drag.fixed
        top = top - @drag.$body.scrollTop()
        left = left - @drag.$body.scrollLeft()

      left = 2 if left < 2
      top = 2 if top < 2

      @$dragged.css({ position:'absolute', left:"#{ left }px", top:"#{ top }px" })
      @dropTarget(mouseLeft, mouseTop, event) if !@direct

    else if @drag.initialized

      # long press measurement of mouse movement prior to drag initialization
      if @options.longpressDelay and @options.longpressDistanceLimit
        @reset() if @distance({ left: mouseLeft, top: mouseTop }, @drag.startPoint) > @options.longpressDistanceLimit

      # delayed initialization after mouse moved a minimal distance
      if @options.minDistance && @distance({ left: mouseLeft, top: mouseTop }, @drag.startPoint) > @minDistance
        @start()


  drop: () ->
    if @drag.started

      # drag specific callback
      if typeof @options.onDrop == 'function'
        @options.onDrop.call(this, @drag, @$origin)

    @reset()


  dropTarget: (mouseLeft, mouseTop, event) ->
    if @$origin && @$dragged && event
      elem = undefined

      # get the element we're currently hovering
      if event.clientX && event.clientY
        @$dragged.hide()
        @drag.preview.hide() if @drag.preview
        # todo: Safari 4 and Opera 10.10 need pageX/Y.
        elem = window.document.elementFromPoint(event.clientX, event.clientY)
        @$dragged.show()

      # check if a drop is possible
      if elem
        # dragTarget = dom.parentContainer(elem)
        dragTarget = dom.dropTarget(elem)
        @drag.target = dragTarget
      else
        @drag.target = undefined

      if typeof @options.onDrag == 'function'
          @options.onDrag.call(this, @drag.target, @drag)


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


DragDrop.placeholder = (drag, $origin) ->
  snippetWidth = drag.width
  numberOfDraggedElems = 1
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



