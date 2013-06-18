class SnippetDrag


  constructor: ({ snippet }) ->
    @snippet = snippet
    @$highlightedContainer = {}
    @onDrag = $.proxy(@onDrag, @)
    @onDrop = $.proxy(@onDrop, @)


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


  onDrop: (drag) ->
    @$highlightedContainer.removeClass?(docClass.containerHighlight)
    dom.restoreContainerHeight()
    target = drag.target
    if target
      if target.containerName
        target.parent.append(target.containerName, @snippet)
      if target.snippet
        if target.position == 'before'
          target.snippet.before(@snippet)
        else
          target.snippet.after(@snippet)

