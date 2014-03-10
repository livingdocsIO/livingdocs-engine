dom = require('./dom')
config = require('../configuration/defaults')

module.exports = class SnippetDrag

  constructor: ({ @snippetModel, snippetView, @page }) ->
    @$view = snippetView.$html if snippetView
    @$highlightedContainer = {}


  # Called by DragBase
  start: ({ top, left }) ->
    @started = true
    @page.editableController.disableAll()
    @page.blurFocusedElement()

    # placeholder below cursor
    @$placeholder = @createPlaceholder()

    # drop marker
    @$dropMarker = $("<div class='doc-drop-marker'>")

    @page.$body
      .append(@$placeholder)
      .append(@$dropMarker)
      .css('cursor', 'pointer')

    # mark dragged snippet
    @$view.addClass(config.html.css.dragged) if @$view?

    # position the placeholder
    @move({ top, left })


  # Called by DragBase
  move: ({ top, left }) ->
    left = 2 if left < 2
    top = 2 if top < 2

    @$placeholder.css(top: "#{ top }px", left: "#{ left }px")
    @target = @findDropTarget({ top, left, event })

    # @scrollIntoView(top, event)


  findDropTarget: ({ top, left, event }) ->
    elem = @getElemUnderCursor(top, left)

    # find the element below the cursor
    if elem?
      target = dom.dropTarget(elem, { top, left })

    if @isValidTarget(target)

      if target.containerName
        dom.maximizeContainerHeight(target.parent)
        $container = $(target.node)
      else if target.snippetView
        dom.maximizeContainerHeight(target.snippetView)
        $container = target.snippetView.get$container()

      @highlighContainer($container) if $container?

      # show drop target
      coords = target.coords
      if coords?
        @$dropMarker
          .css({ left:"#{ coords.left }px", top:"#{ coords.top - 5}px", width:"#{ coords.width }px" })
          .show()

      return target
    else
      @$dropMarker.hide()
      return undefined



  highlighContainer: ($container) ->
    if $container[0] != @$highlightedContainer[0]
      @$highlightedContainer.removeClass?(config.html.css.containerHighlight)
      @$highlightedContainer = $container
      @$highlightedContainer.addClass?(config.html.css.containerHighlight)


  getElemUnderCursor: (top, left) ->
    top = top - @page.$body.scrollTop()
    left = left - @page.$body.scrollLeft()

    @$placeholder.hide()
    elem = @page.document.elementFromPoint(left, top)
    @$placeholder.show()
    elem


  isValidTarget: (target) ->
    if target?.snippetView? && target.snippetView.model != @snippetModel
      return true
    else if target?.containerName
      return true

    false


  # Called by DragBase
  drop: ->
    if @target?
      @moveToTarget(@target)
      @page.snippetWasDropped.fire(@snippetModel)
    else
      #consider: maybe add a 'drop failed' effect


  # Move the snippet after a successful drop
  moveToTarget: (target) ->
    if snippetView = target.snippetView
      if target.position == 'before'
        snippetView.model.before(@snippetModel)
      else
        snippetView.model.after(@snippetModel)
    else if target.containerName
      target.parent.model.append(target.containerName, @snippetModel)


  # Called by DragBase
  # Reset is always called after a drag ended.
  reset: ->
    if @started

      # undo DOM changes
      @page.$body.css('cursor', '')
      @page.editableController.reenableAll()
      @$highlightedContainer.removeClass?(config.html.css.containerHighlight)
      @$view.removeClass(config.html.css.dragged) if @$view?
      dom.restoreContainerHeight()

      # remove elements
      @$placeholder.remove()
      @$dropMarker.remove()


  createPlaceholder: ->
    numberOfDraggedElems = 1
    template = """
      <div class="doc-drag-placeholder-item">
        <span class="doc-drag-counter">#{ numberOfDraggedElems }</span>
        Selected Item
      </div>
      """

    $placeholder = $(template)
      .css(position: "absolute")
