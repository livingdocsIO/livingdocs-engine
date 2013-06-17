# page
# ----
# Defines the API between the DOM and the document
page = do ->

  # Private
  # -------

  $document = $(window.document)

  # page object
  # -----------

  # @param rootNode (optional) DOM node that should contain the content
  # @return jQuery object: the root node of the document
  getDocumentSection: ({ rootNode } = {}) ->
    if !rootNode
      $root = $(".#{ docClass.section }").first()
    else
      $root = $(rootNode).addClass(".#{ docClass.section }")

    error('no rootNode found') if !$root.length
    $root


  initializeListeners: () ->
    # $document.on 'focus.livingdocs', (event) ->
    #   focus.focusChange(event)
    @snippetDrag = new DragDrop
      longpressDelay: 400
      longpressDistanceLimit: 10
      preventDefault: false

    $document
      .on('click.livingdocs', $.proxy(@click, @))
      .on('mousedown.livingdocs', $.proxy(@mousedown, @))
      .on('mouseup.livingdocs', $.proxy(@mouseup, @))


  removeListeners: () ->
    $document.off('.livingdocs')
    $document.off('.livingdocs-drag')


  mousedown: (event) ->
    return if event.which != 1 # only respond to left mouse button
    snippet = dom.parentSnippet(event.target)

    if snippet
      $document.on 'mousemove.livingdocs-drag', $.proxy(@snippetDragMove, @)
      $snippet = snippet.snippetHtml.$html

      $highlightedContainer = {}
      @snippetDrag.mousedown $snippet, event,
        onDrag: (target, drag) =>
          if target.containerName
            dom.maximizeContainerHeight(target.parent)
            if target.node != $highlightedContainer[0]
              $highlightedContainer.removeClass?(docClass.containerHighlight)
              $highlightedContainer = $(target.node)
              $highlightedContainer.addClass(docClass.containerHighlight)
          if target.snippet
            dom.maximizeContainerHeight(target.snippet)


        onDrop: (drag) =>
          if $highlightedContainer.removeClass
            $highlightedContainer.removeClass(docClass.containerHighlight)

          dom.restoreContainerHeight()

          target = drag.target
          if target
            if target.containerName
              target.parent.append(target.containerName, snippet)
            if target.snippet
              target.snippet.after(snippet)


  snippetDragMove: (event) ->
    # Code from jquery.ui.mouse.js#_mouseMove
    # IE versions below 9 - mouseup check: mouseup happened when mouse was out of window
    # if $.browser.msie && !(document.documentMode >= 9) && !event.button
    #   return @mouseup(event)

    @snippetDrag.move(event.pageX, event.pageY, event)


  mouseup: (event) ->
    @snippetDrag.drop()
    $document.off('.livingdocs-drag')


  click: (event) ->
    snippet = dom.parentSnippet(event.target)

    # todo: if a user clicked on a margin of a snippet it should
    # still get selected. (if a snippet is found by parentSnippet
    # and that snippet has no children we do not need to search)

    # if snippet hasChildren, make sure we didn't want to select
    # a child

    # if no snippet was selected check if the user was not clicking
    # on a margin of a snippet

    # todo: check if the click was meant for a snippet container
    if snippet
      focus.snippetFocused(snippet)
    else
      focus.blur()


  getFocusedElement: () ->
    window.document.activeElement


  blurFocusedElement: () ->
    focus.setFocus(undefined)
    focusedElement = @getFocusedElement()
    $(focusedElement).blur() if focusedElement


