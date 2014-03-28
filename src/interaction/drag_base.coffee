config = require('../configuration/defaults')

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


  # start a possible drag
  # the drag is only really started if constraints are not violated (longpressDelay and longpressDistanceLimit or minDistance)
  init: (dragHandler, event, options) ->
    @reset()
    @initialized = true
    @setOptions(options)
    @setDragHandler(dragHandler)
    @startPoint = @getTopLeft(event)

    @addStopListeners(event)
    @addMoveListeners(event)

    if @mode == 'longpress'
      @addLongpressIndicator(@startPoint)
      @timeout = setTimeout =>
          @removeLongpressIndicator()
          @start(@startPoint)
        , @options.longpress.delay
    else if @mode == 'direct'
      @start(@startPoint)

    # prevent browser Drag & Drop
    event.preventDefault() if @options.preventDefault


  move: (topLeft) ->
    if @mode == 'longpress'
      if @distance(topLeft, @startPoint) > @options.longpress.tolerance
        @reset()
    else if @mode == 'move'
      if @distance(topLeft, @startPoint) > @options.move.distance
        @start(topLeft)


  # start the drag process
  start: (topLeft) ->
    @started = true

    # prevent text-selections while dragging
    @addBlocker()
    @page.$body.addClass(config.css.preventSelection)
    @dragHandler.start(topLeft)


  drop: ->
    @dragHandler.drop() if @started
    @reset()


  reset: ->
    if @started
      @started = false
      @page.$body.removeClass(config.css.preventSelection)


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
    $blocker = $("<div class='dragBlocker'>")
      .attr('style', 'position: absolute; top: 0; bottom: 0; left: 0; right: 0;')
    @page.$body.append($blocker)


  removeBlocker: ->
    @page.$body.find('.dragBlocker').remove()



  addLongpressIndicator: ({ top, left }) ->
    return unless @options.longpress.showIndicator
    $indicator = $("<div class=\"#{ config.css.longpressIndicator }\"><div></div></div>")
    $indicator.css(top: top, left: left)
    @page.$body.append($indicator)


  removeLongpressIndicator: ->
    @page.$body.find(".#{ config.css.longpressIndicator }").remove()


  # These events are initialized immediately to allow a long-press finish
  addStopListeners: (event) ->
    eventNames =
      if event.type == 'touchstart'
        'touchend.livingdocs-drag touchcancel.livingdocs-drag touchleave.livingdocs-drag'
      else
        'mouseup.livingdocs-drag'

    @page.$document.on eventNames, =>
      @drop()


  # These events are possibly initialized with a delay in snippetDrag#onStart
  addMoveListeners: (event) ->
    if event.type == 'touchstart'
      @page.$document.on 'touchmove.livingdocs-drag', (event) =>
        event.preventDefault()
        if @started
          @dragHandler.move(@getTopLeft(event), event)
        else
          @move(@getTopLeft(event))

    else # all other input devices behave like a mouse
      @page.$document.on 'mousemove.livingdocs-drag', (event) =>
        if @started
          @dragHandler.move(@getTopLeft(event), event)
        else
          @move(@getTopLeft(event))


  # Get Top Left relative to the document (absolute)
  getTopLeft: (event) ->
    if event.type == 'touchstart' || event.type == 'touchmove'
      'top': event.originalEvent.changedTouches[0].pageY
      'left': event.originalEvent.changedTouches[0].pageX
    else
      'top': event.pageY
      'left': event.pageX


  # Get Top Left relative to the viewport (fixed)
  getTopLeftFixed: (event) ->
    if event.type == 'touchstart' || event.type == 'touchmove'
      'top': event.originalEvent.changedTouches[0].clientY
      'left': event.originalEvent.changedTouches[0].clientX
    else
      'top': event.clientY
      'left': event.clientX


  distance: (pointA, pointB) ->
    return undefined if !pointA || !pointB

    distX = pointA.left - pointB.left
    distY = pointA.top - pointB.top
    Math.sqrt( (distX * distX) + (distY * distY) )



