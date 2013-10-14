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

  @createView = $.proxy(document, 'createView')

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
  @toHtml = $.proxy(document, 'toHtml')
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

  # Fired when a snippet is focused
  # callback: (snippetView) ->
  @snippetFocused = chainable(page.focus.snippetFocus, 'add')

  # Fired when a snippet is blurred
  # (always fire before the next focus event)
  # callback: (snippetView) ->
  @snippetBlurred = chainable(page.focus.snippetBlur, 'add')

  # Call to start a drag operation
  @startDrag = $.proxy(page, 'startDrag')

  # Snippet Drag & Drop events
  @snippetWillBeDragged = $.proxy(page.snippetWillBeDragged, 'add')
  @snippetWillBeDragged.remove = $.proxy(page.snippetWillBeDragged, 'remove')
  @snippetWasDropped = $.proxy(page.snippetWasDropped, 'add')
  @snippetWasDropped.remove = $.proxy(page.snippetWasDropped, 'remove')

  # Fired when a user clicks on an editable image
  # example callback method:
  # (snippetView, imageName) -> snippetView.model.set(imageName, imageSrc)
  @imageClick = chainable(page.imageClick, 'add')


  # Fired when a user click on an editable html element or one of its children
  # example callback methods:
  # (snippetView, htmlElementName, event) -> # your code here
  @htmlElementClick = chainable(page.htmlElementClick, 'add')

  # Text Events
  # -----------

  # Fired when editable text is selected
  # callback: (snippetView, element, selection) ->
  # @callbackParam snippetView - snippetView instance
  # @callbackParam element - DOM node with contenteditable
  # @callbackParam selection - selection object from editableJS
  @textSelection = chainable(page.editableController.selection, 'add')


# execute API setup
setupApi.call(doc)
doc.ready ->
  pageReady.call(doc)



