# Public API
# ----------
# Since the livingdocs-engine code is contained in its own function closure
# we expose our public API here explicitly.
#
# `doc()`: primary function interface similar to jquery
# with snippet selectors and stuff...
@doc = (search) ->
  document.find(search)

chainable = chainableProxy(doc)

setupApi = ->

  # Initialize the document
  @loadDocument = chainable(document, 'loadDocument')
  @ready = chainable(document.ready, 'add')

  # Add Templates to the documents
  @addDesign = chainable(document, 'addDesign')
  @getDesign = -> document.design

  # Append a snippet to the document
  # @param input: (String) snippet identifier e.g. "bootstrap.title" or (Snippet)
  # @return Snippet
  @add = $.proxy(document, 'add')

  # Create a new snippet instance (not inserted into the document)
  # @param identifier: (String) snippet identifier e.g. "bootstrap.title"
  # @return Snippet
  @create = $.proxy(document, 'createSnippet')

  # Json that can be used for saving of the document
  @toJson = $.proxy(document, 'toJson')
  @readableJson = -> words.readableJson( document.toJson() )

  # Print the content of the snippetTree in a readable string
  @printTree = $.proxy(document, 'printTree')

  @eachContainer = chainable(document, 'eachContainer')
  @document = document

  @changed = chainable(document.changed, 'add')
  @DragDrop = DragDrop

  # Expose words string util
  @words = words


  # Stash
  # -----
  stash.init()
  @stash = $.proxy(stash, 'stash')
  @stash.snapshot = $.proxy(stash, 'snapshot')
  @stash.delete = $.proxy(stash, 'delete')
  @stash.restore = $.proxy(stash, 'restore')
  @stash.get = $.proxy(stash, 'get')
  @stash.list = $.proxy(stash, 'list')


  # For Plugins & Extensions
  # ------------------------

  # enable snippet finder plugins
  @fn = SnippetArray::


# API methods that are only available after the page has initialized
pageReady = ->
  page = document.page

  @restore = chainable(document, 'restore')

  # Events
  # ------
  @snippetFocused = chainable(page.focus.snippetFocus, 'add')
  @snippetBlurred = chainable(page.focus.snippetBlur, 'add')
  @textSelection = chainable(page.editableController.selection, 'add')
  @startDrag = $.proxy(page, 'startDrag')

  @imageClick = chainable(page.imageClick, 'add')


# execute API setup
setupApi.call(doc)
doc.ready ->
  pageReady.call(doc)



