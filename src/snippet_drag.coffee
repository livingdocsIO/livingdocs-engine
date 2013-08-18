class SnippetDrag


  constructor: ({ snippet, page }) ->
    @snippet = snippet
    @page = page
    @$highlightedContainer = {}
    @onStart = $.proxy(@onStart, @)
    @onDrag = $.proxy(@onDrag, @)
    @onDrop = $.proxy(@onDrop, @)
    @classAdded = []


  onStart: () ->
    @$insertPreview = $("<div class='doc-drag-preview'>")
    @page.$body
      .append(@$insertPreview)
      .css('cursor', 'pointer')

    @page.blurFocusedElement()

    #todo get all valid containers


  # remeve classes added while dragging from tracked elements
  removeCssClasses: ->
    for $html in @classAdded
      $html
        .removeClass(docClass.afterDrop)
        .removeClass(docClass.beforeDrop)
    @classAdded = []


  isValidTarget: (target) ->
    if target.snippetElem && target.snippetElem.model != @snippet
      return true
    else if target.containerName
      return true

    false


  onDrag: (target, drag, cursor) ->
    if not @isValidTarget(target)
      $container = target = {}

    if target.containerName
      dom.maximizeContainerHeight(target.parent)
      $container = $(target.node)
    else if target.snippetElem
      dom.maximizeContainerHeight(target.snippetElem)
      $container = target.snippetElem.get$container()
      $container.addClass(docClass.containerHighlight)
    else
      $container = target = {}

    # highlighting
    if $container[0] != @$highlightedContainer[0]
      @$highlightedContainer.removeClass?(docClass.containerHighlight)
      @$highlightedContainer = $container
      @$highlightedContainer.addClass?(docClass.containerHighlight)

    # show drop target
    if target.coords
      coords = target.coords
      @$insertPreview
        .css({ left:"#{ coords.left }px", top:"#{ coords.top - 5}px", width:"#{ coords.width }px" })
        .show()
    else
      @$insertPreview.hide()


  onDrop: (drag) ->
    # @removeCssClasses()
    @page.$body.css('cursor', '')
    @$insertPreview.remove()
    @$highlightedContainer.removeClass?(docClass.containerHighlight)
    dom.restoreContainerHeight()
    target = drag.target

    if target and @isValidTarget(target)
      if snippetElem = target.snippetElem
        if target.position == 'before'
          snippetElem.model.before(@snippet)
        else
          snippetElem.model.after(@snippet)
      else if target.containerName
        target.parent.model.append(target.containerName, @snippet)
    else
      #consider: maybe add a 'drop failed' effect

