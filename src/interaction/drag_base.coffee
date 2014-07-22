config = require('../configuration/defaults')
css = config.css

# DragBase
#
# Supported drag modes:
# - Direct (start immediately)
# - Longpress (start after a delay if the cursor does not move too much)
# - Move (start after the cursor moved a minumum distance)
module.exports = class DragBase

  constructor: (@page, options) ->
    @modes = ['direct', 'longpress', 'move']

    defaultConfig =
      preventDefault: false
      onDragStart: undefined
      scrollArea: 50
      longpress:
        showIndicator: true
        delay: 400
        tolerance: 3
      move:
        distance: 0

    @defaultConfig = $.extend(true, defaultConfig, options)

    @startPoint = undefined
    @dragHandler = undefined
    @initialized = false
    @started = false


  setOptions: (options) ->
    @options = $.extend(true, {}, @defaultConfig, options)
    @mode = if options.direct?
      'direct'
    else if options.longpress?
      'longpress'
    else if options.move?
      'move'
    else
      'longpress'


  setDragHandler: (dragHandler) ->
    @dragHandler = dragHandler
    @dragHandler.page = @page


  # Start a possible drag
  # The drag is only really started if constraints are not violated
  # (longpressDelay and longpressDistanceLimit or minDistance).
  init: (dragHandler, event, options) ->
    @reset()
    @initialized = true
    @setOptions(options)
    @setDragHandler(dragHandler)
    @startPoint = @getEventPosition(event)

    @addStopListeners(event)
    @addMoveListeners(event)

    if @mode == 'longpress'
      @addLongpressIndicator(@startPoint)
      @timeout = setTimeout =>
          @removeLongpressIndicator()
          @start(event)
        , @options.longpress.delay
    else if @mode == 'direct'
      @start(event)

    # prevent browser Drag & Drop
    event.preventDefault() if @options.preventDefault


  move: (event) ->
    eventPosition = @getEventPosition(event)
    if @mode == 'longpress'
      if @distance(eventPosition, @startPoint) > @options.longpress.tolerance
        @reset()
    else if @mode == 'move'
      if @distance(eventPosition, @startPoint) > @options.move.distance
        @start(event)


  # start the drag process
  start: (event) ->
    eventPosition = @getEventPosition(event)
    @started = true

    # prevent text-selections while dragging
    @addBlocker()
    @page.$body.addClass(css.preventSelection)
    @dragHandler.start(eventPosition)


  drop: (event) ->
    @dragHandler.drop(event) if @started
    @reset()


  cancel: ->
    @reset()


  reset: ->
    if @started
      @started = false
      @page.$body.removeClass(css.preventSelection)

    if @initialized
      @initialized = false
      @startPoint = undefined
      @dragHandler.reset()
      @dragHandler = undefined
      if @timeout?
        clearTimeout(@timeout)
        @timeout = undefined

      @page.$document.off('.livingdocs-drag')
      @removeLongpressIndicator()
      @removeBlocker()


  addBlocker: ->
    $blocker = $("<div class='#{ css.dragBlocker }'>")
      .attr('style', 'position: absolute; top: 0; bottom: 0; left: 0; right: 0;')
    @page.$body.append($blocker)


  removeBlocker: ->
    @page.$body.find(".#{ css.dragBlocker }").remove()


  addLongpressIndicator: ({ pageX, pageY }) ->
    return unless @options.longpress.showIndicator
    $indicator = $("<div class=\"#{ css.longpressIndicator }\"><div></div></div>")
    $indicator.css(left: pageX, top: pageY)
    @page.$body.append($indicator)


  removeLongpressIndicator: ->
    @page.$body.find(".#{ css.longpressIndicator }").remove()


  # These events are initialized immediately to allow a long-press finish
  addStopListeners: (event) ->
    eventNames =
      if event.type == 'touchstart'
        'touchend.livingdocs-drag touchcancel.livingdocs-drag touchleave.livingdocs-drag'
      else if event.type == 'dragenter' || event.type == 'dragbetterenter'
        'drop.livingdocs-drag dragend.livingdocs-drag'
      else
        'mouseup.livingdocs-drag'

    @page.$document.on eventNames, (event) =>
      @drop(event)


  # These events are possibly initialized with a delay in snippetDrag#onStart
  addMoveListeners: (event) ->
    if event.type == 'touchstart'
      @page.$document.on 'touchmove.livingdocs-drag', (event) =>
        event.preventDefault()
        if @started
          @dragHandler.move(@getEventPosition(event))
        else
          @move(event)

    else if event.type == 'dragenter' || event.type == 'dragbetterenter'
      @page.$document.on 'dragover.livingdocs-drag', (event) =>
        if @started
          @dragHandler.move(@getEventPosition(event))
        else
          @move(event)

    else # all other input devices behave like a mouse
      @page.$document.on 'mousemove.livingdocs-drag', (event) =>
        if @started
          @dragHandler.move(@getEventPosition(event))
        else
          @move(event)


  getEventPosition: (event) ->
    if event.type == 'touchstart' || event.type == 'touchmove'
      event = event.originalEvent.changedTouches[0]

    # So far I do not understand why the jQuery event does not contain clientX etc.
    else if event.type == 'dragover'
      event = event.originalEvent

    clientX: event.clientX
    clientY: event.clientY
    pageX: event.pageX
    pageY: event.pageY


  distance: (pointA, pointB) ->
    return undefined if !pointA || !pointB

    distX = pointA.pageX - pointB.pageX
    distY = pointA.pageY - pointB.pageY
    Math.sqrt( (distX * distX) + (distY * distY) )



