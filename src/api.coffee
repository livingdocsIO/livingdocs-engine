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

  # kickstart the document
  @kickstart = chainable(kickstart, 'init')

    # Initialize the document
  @init = chainable(document, 'init')
  @ready = chainable(document.ready, 'add')

  # Add Templates to the documents
  @getDesign = -> document.design

  # Append a snippet to the document
  # @param input: (String) snippet identifier e.g. "bootstrap.title" or (Snippet)
  # @return SnippetModel
  @add = $.proxy(document, 'add')

  # Create a new snippet instance (not inserted into the document)
  # @param identifier: (String) snippet identifier e.g. "bootstrap.title"
  # @return SnippetModel
  @create = $.proxy(document, 'createModel')

  # Json that can be used for saving of the document
  @toJson = $.proxy(document, 'toJson')
  @readableJson = -> words.readableJson( document.toJson() )

  # Print the content of the snippetTree in a readable string
  @printTree = $.proxy(document, 'printTree')

  @eachContainer = chainable(document, 'eachContainer')
  @document = document

  @changed = chainable(document.changed, 'add')
  @DragDrop = DragDrop

  # Stash
  # -----

  stash.init()
  @stash = $.proxy(stash, 'stash')
  @stash.snapshot = $.proxy(stash, 'snapshot')
  @stash.delete = $.proxy(stash, 'delete')
  @stash.restore = $.proxy(stash, 'restore')
  @stash.get = $.proxy(stash, 'get')
  @stash.list = $.proxy(stash, 'list')


  # Utils
  # -----

  # Expose string util 'words'
  @words = words


  # For Plugins & Extensions
  # ------------------------

  # enable snippet finder plugins (jquery like)
  @fn = SnippetArray::


# API methods that are only available after the page has initialized
pageReady = ->
  page = document.page

  @restore = chainable(document, 'restore')

  # Events
  # ------

  # Raised when a snippet is focused
  # callback: (snippetView) ->
  @snippetFocused = chainable(page.focus.snippetFocus, 'add')

  # Raised when a snippet is blurred
  # (always raised before the next focus event)
  # callback: (snippetView) ->
  @snippetBlurred = chainable(page.focus.snippetBlur, 'add')

  # Raised when a snippet is inserted into the snippetTree
  # callback: (snippetModel) ->
  @snippetAdded = chainable(document.snippetTree.snippetAdded, 'add')

  # Raised when a snippet is being dragged
  @startDrag = $.proxy(page, 'startDrag')

  # Raised when a user clicks on an editable image
  # example callback method:
  # (snippetView, imageName) -> snippetView.model.set(imageName, imageSrc)
  @imageClick = chainable(page.imageClick, 'add')


  # Text Events
  # -----------

  # Raised when editable text is selected
  # callback: (snippetView, element, selection) ->
  # @callbackParam snippetView - snippetView instance
  # @callbackParam element - DOM node with contenteditable
  # @callbackParam selection - selection object from editableJS
  @textSelection = chainable(page.editableController.selection, 'add')


# execute API setup
setupApi.call(doc)
doc.ready ->
  pageReady.call(doc)



