# page
# ----
# Defines the API between the DOM and the document
class Page


  constructor: ->
    @$document = $(window.document)
    @$body = $(window.document.body)

    @loader = new Loader()
    @focus = new Focus()
    @editableController = new EditableController(this)

    @snippetDragDrop = new DragDrop
      longpressDelay: 400
      longpressDistanceLimit: 10
      preventDefault: false

    @$document
      .on('click.livingdocs', $.proxy(@click, @))
      .on('mousedown.livingdocs', $.proxy(@mousedown, @))
      .on('dragstart', $.proxy(@browserDragStart, @))


  # prevent the browser Drag&Drop from interfering
  browserDragStart: (event) ->
    event.preventDefault()
    event.stopPropagation()


  removeListeners: ->
    @$document.off('.livingdocs')
    @$document.off('.livingdocs-drag')


  # @param rootNode (optional) DOM node that should contain the content
  # @return jQuery object: the root node of the document
  getDocumentSection: ({ rootNode } = {}) ->
    if !rootNode
      $root = $(".#{ docClass.section }").first()
    else
      $root = $(rootNode).addClass(".#{ docClass.section }")

    log.error('no rootNode found') if !$root.length
    $root


  mousedown: (event) ->
    return if event.which != 1 # only respond to left mouse button
    snippetElem = dom.parentSnippetElem(event.target)

    if snippetElem
      @startDrag(snippetElem: snippetElem, dragDrop: @snippetDragDrop)


  startDrag: ({ snippet, snippetElem, dragDrop }) ->
    return unless snippet || snippetElem
    snippet = snippetElem.snippet if snippetElem

    @$document.on 'mousemove.livingdocs-drag', (event) ->
      dragDrop.move(event.pageX, event.pageY, event)

    @$document.on 'mouseup.livingdocs-drag', =>
      dragDrop.drop()
      @$document.off('.livingdocs-drag')

    snippetDrag = new SnippetDrag({ snippet: snippet, page: this })

    $snippet = snippetElem.$html if snippetElem
    dragDrop.mousedown $snippet, event,
      onDragStart: snippetDrag.onStart
      onDrag: snippetDrag.onDrag
      onDrop: snippetDrag.onDrop


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
      @focus.snippetFocused(snippet)
    else
      @focus.blur()


  getFocusedElement: ->
    window.document.activeElement


  blurFocusedElement: ->
    @focus.setFocus(undefined)
    focusedElement = @getFocusedElement()
    $(focusedElement).blur() if focusedElement

