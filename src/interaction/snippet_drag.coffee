dom = require('./dom')
config = require('../configuration/defaults')
css = config.css

module.exports = class SnippetDrag

  wiggleSpace = 0
  startAndEndOffset = 0

  constructor: ({ @snippetModel, snippetView }) ->
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
    @$dropMarker = $("<div class='#{ css.dropMarker }'>")

    @page.$body
      .append(@$dropMarker)
      .append(@$placeholder)
      .css('cursor', 'pointer')

    # mark dragged snippet
    @$view.addClass(css.dragged) if @$view?

    # position the placeholder
    @move({ top, left })


  # Called by DragBase
  move: ({ top, left }, event) ->
    left = 2 if left < 2
    top = 2 if top < 2

    @$placeholder.css(top: "#{ top }px", left: "#{ left }px")
    @target = @findDropTarget({ top, left }, event)

    # @scrollIntoView(top, event)


  findDropTarget: ({ top, left }, event) ->
    elem = @getElemUnderCursor(top, left)

    # return the same as last time if the cursor is above the dropMarker
    return @target if elem == @$dropMarker[0]

    target = dom.dropTarget(elem, { top, left }) if elem?
    @undoMakeSpace()

    if target? && target.snippetView?.model != @snippetModel
      @$placeholder.removeClass(css.noDrop)
      @markDropPosition(target)

      # if target.containerName
      #   dom.maximizeContainerHeight(target.parent)
      #   $container = $(target.node)
      # else if target.snippetView
      #   dom.maximizeContainerHeight(target.snippetView)
      #   $container = target.snippetView.get$container()

      return target
    else
      @$dropMarker.hide()
      @removeContainerHighlight()

      if not target?
        @$placeholder.addClass(css.noDrop)
      else
        @$placeholder.removeClass(css.noDrop)

      return undefined


  markDropPosition: (target) ->
    switch target.target
      when 'snippet'
        @snippetPosition(target)
        @removeContainerHighlight()
      when 'container'
        @showMarkerAtBeginningOfContainer(target.node)
        @highlighContainer($(target.node))
      when 'root'
        @showMarkerAtBeginningOfContainer(target.node)
        @highlighContainer($(target.node))


  snippetPosition: (target) ->
    if target.position == 'before'
      before = target.snippetView.prev()

      if before?
        if before.model == @snippetModel
          target.position = 'after'
          return @snippetPosition(target)

        @showMarkerBetweenSnippets(before, target.snippetView)
      else
        @showMarkerAtBeginningOfContainer(target.snippetView.$elem[0].parentNode)
    else
      next = target.snippetView.next()
      if next?
        if next.model == @snippetModel
          target.position = 'before'
          return @snippetPosition(target)

        @showMarkerBetweenSnippets(target.snippetView, next)
      else
        @showMarkerAtEndOfContainer(target.snippetView.$elem[0].parentNode)


  showMarkerBetweenSnippets: (viewA, viewB) ->
    boxA = dom.getBoundingClientRect(viewA.$elem[0])
    boxB = dom.getBoundingClientRect(viewB.$elem[0])

    halfGap = if boxB.top > boxA.bottom
      (boxB.top - boxA.bottom) / 2
    else
      0

    @showMarker
      left: boxA.left
      top: boxA.bottom + halfGap
      width: boxA.width


  showMarkerAtBeginningOfContainer: (elem) ->
    return unless elem?

    @makeSpace(elem.firstChild, 'top')
    box = dom.getBoundingClientRect(elem)
    @showMarker
      left: box.left
      top: box.top + startAndEndOffset
      width: box.width


  showMarkerAtEndOfContainer: (elem) ->
    return unless elem?

    @makeSpace(elem.lastChild, 'bottom')
    box = dom.getBoundingClientRect(elem)
    @showMarker
      left: box.left
      top: box.bottom - startAndEndOffset
      width: box.width


  showMarker: ({ top, left, width }) ->
    @$dropMarker
      .css
        left:  "#{ left }px"
        top:   "#{ top }px"
        width: "#{ width }px"
      .show()


  makeSpace: (node, position) ->
    return unless node? && wiggleSpace
    $node = $(node)
    @lastTransform = $node

    if position == 'top'
      $node.css(transform: "translate(0, #{ wiggleSpace }px)")
    else
      $node.css(transform: "translate(0, -#{ wiggleSpace }px)")


  undoMakeSpace: (node) ->
    if @lastTransform?
      @lastTransform.css(transform: '')
      @lastTransform = undefined


  highlighContainer: ($container) ->
    if $container[0] != @$highlightedContainer[0]
      @$highlightedContainer.removeClass?(css.containerHighlight)
      @$highlightedContainer = $container
      @$highlightedContainer.addClass?(css.containerHighlight)


  removeContainerHighlight: ->
    @$highlightedContainer.removeClass?(css.containerHighlight)
    @$highlightedContainer = {}


  getElemUnderCursor: (top, left) ->
    top = top - @page.$body.scrollTop()
    left = left - @page.$body.scrollLeft()

    @$placeholder.hide()
    elem = @page.document.elementFromPoint(left, top)
    @$placeholder.show()
    elem


  # Called by DragBase
  drop: ->
    if @target?
      @moveToTarget(@target)
      @page.snippetWasDropped.fire(@snippetModel)
    else
      #consider: maybe add a 'drop failed' effect


  # Move the snippet after a successful drop
  moveToTarget: (target) ->
    switch target.target
      when 'snippet'
        snippetView = target.snippetView
        if target.position == 'before'
          snippetView.model.before(@snippetModel)
        else
          snippetView.model.after(@snippetModel)
      when 'container'
        snippetModel = target.snippetView.model
        snippetModel.append(target.containerName, @snippetModel)
      when 'root'
        snippetTree = target.snippetTree
        snippetTree.prepend(@snippetModel)



  # Called by DragBase
  # Reset is always called after a drag ended.
  reset: ->
    if @started

      # undo DOM changes
      @undoMakeSpace()
      @removeContainerHighlight()
      @page.$body.css('cursor', '')
      @page.editableController.reenableAll()
      @$view.removeClass(css.dragged) if @$view?
      dom.restoreContainerHeight()

      # remove elements
      @$placeholder.remove()
      @$dropMarker.remove()


  createPlaceholder: ->
    numberOfDraggedElems = 1
    template = """
      <div class="#{ css.draggedPlaceholder }">
        <span class="#{ css.draggedPlaceholderCounter }">
          #{ numberOfDraggedElems }
        </span>
        Selected Item
      </div>
      """

    $placeholder = $(template)
      .css(position: "absolute")
