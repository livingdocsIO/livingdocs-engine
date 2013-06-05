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

    $document
      .on 'click.livingdocs', $.proxy(@pageClick, @)


  removeListeners: () ->
    $document.off('.livingdocs')


  pageClick: (event) ->
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
    focusedElement = @getFocusedElement()
    $(focusedElement).blur() if focusedElement


