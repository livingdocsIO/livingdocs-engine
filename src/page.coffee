# page
# ----
# Defines the API between the DOM and the document
page = do ->

  # page object
  # -----------

  $document: $(window.document)
  $body: $(window.document.body)


  # @param rootNode (optional) DOM node that should contain the content
  # @return jQuery object: the root node of the document
  getDocumentSection: ({ rootNode } = {}) ->
    if !rootNode
      $root = $(".#{ docClass.section }").first()
    else
      $root = $(rootNode).addClass(".#{ docClass.section }")

    log.error('no rootNode found') if !$root.length
    $root


  initializeListeners: () ->
    # @$document.on 'focus.livingdocs', (event) ->
    #   focus.focusChange(event)
    @snippetDragDrop = new DragDrop
      longpressDelay: 400
      longpressDistanceLimit: 10
      preventDefault: false

    @$document
      .on('click.livingdocs', $.proxy(@click, @))
      .on('mousedown.livingdocs', $.proxy(@mousedown, @))


  removeListeners: () ->
    @$document.off('.livingdocs')
    @$document.off('.livingdocs-drag')


  mousedown: (event) ->
    return if event.which != 1 # only respond to left mouse button
    snippet = dom.parentSnippet(event.target)

    if snippet
      @$document.on 'mousemove.livingdocs-drag', $.proxy(@snippetDragMove, @)
      @$document.on 'mouseup.livingdocs-drag', $.proxy(@snippetDragEnd, @)
      $snippet = snippet.snippetHtml.$html

      snippetDrag = new SnippetDrag({ snippet })
      @snippetDragDrop.mousedown $snippet, event,
        onDragStart: snippetDrag.onStart
        onDrag: snippetDrag.onDrag
        onDrop: snippetDrag.onDrop


  snippetDragMove: (event) ->
    # Code from jquery.ui.mouse.js#_mouseMove
    # IE versions below 9 - mouseup check: mouseup happened when mouse was out of window
    # if $.browser.msie && !(document.documentMode >= 9) && !event.button
    #   return @mouseup(event)

    @snippetDragDrop.move(event.pageX, event.pageY, event)


  snippetDragEnd: (event) ->
    @snippetDragDrop.drop()
    @$document.off('.livingdocs-drag')


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

@page = page
