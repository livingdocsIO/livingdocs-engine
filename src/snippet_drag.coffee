class SnippetDrag


  constructor: ({ snippet }) ->
    @snippet = snippet
    @$highlightedContainer = {}
    @onStart = $.proxy(@onStart, @)
    @onDrag = $.proxy(@onDrag, @)
    @onDrop = $.proxy(@onDrop, @)
    @classAdded = []


  onStart: () ->
    @$insertPreview = $("<div class='doc-drag-preview'>")
    page.$body
      .append(@$insertPreview)
      .css('cursor', 'pointer')


  # remeve classes added while dragging from tracked elements
  removeCssClasses: () ->
    for $html in @classAdded
      $html
        .removeClass(docClass.afterDrop)
        .removeClass(docClass.beforeDrop)
    @classAdded = []


  onDrag: (target, drag, cursor) ->
    if target.containerName
      dom.maximizeContainerHeight(target.parent)
      $container = $(target.node)
    else if target.snippet
      dom.maximizeContainerHeight(target.snippet)
      $container = target.snippet.parentContainer.$html()
      $container.addClass(docClass.containerHighlight)
    else
      $container = {}

    # highlighting
    if $container[0] != @$highlightedContainer[0]
      @$highlightedContainer.removeClass?(docClass.containerHighlight)
      @$highlightedContainer = $container
      @$highlightedContainer.addClass?(docClass.containerHighlight)

    # # show drop target
    # @removeCssClasses()
    # if target.snippet
    #   $html = target.snippet.snippetHtml.$html
    #   @classAdded.push($html)
    #   if target.position == 'before'
    #     $html.addClass(docClass.afterDrop)
    #   else
    #     $html.addClass(docClass.beforeDrop)

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
    page.$body.css('cursor', '')
    @$insertPreview.remove()
    @$highlightedContainer.removeClass?(docClass.containerHighlight)
    dom.restoreContainerHeight()
    target = drag.target
    if target
      if target.snippet
        if target.position == 'before'
          target.snippet.before(@snippet)
        else
          target.snippet.after(@snippet)
      else if target.containerName
        target.parent.append(target.containerName, @snippet)
    else
      #consider: maybe add a 'drop failed' effect

