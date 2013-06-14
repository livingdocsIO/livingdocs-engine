# Public API
# ----------
# Since the livingdocs-engine code is contained in its own function closure
# we expose our public API here explicitly.
#
#
# `doc()`: primary function interface similar to jquery
# with snippet selectors and stuff...
@doc = (search) ->
  document.find(search)


# Helper method to create chainable proxies.
# Works the same as $.proxy() *its mostly the same code ;)*
chainable = (fn, context) ->

  if typeof context == 'string'
    tmp = fn[ context ]
    context = fn
    fn = tmp

  # Simulated bind
  args = Array.prototype.slice.call( arguments, 2 )
  proxy = ->
    fn.apply( context || this, args.concat( Array.prototype.slice.call( arguments ) ) )
    doc

  proxy


# add public API methods to the doc function
( ->


  # Document Setup & Manipulation
  # -----------------------------

  # Initialize the document
  @loadDocument = chainable(document, 'loadDocument')

  # Add SnippetTemplates to the documents
  @addSnippetCollection = chainable(document, 'addSnippetCollection')

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
  @restore = chainable(document, 'restore')


  # Stash
  # -----
  stash.init()
  @stash = $.proxy(stash, 'stash')
  @stash.snapshot = $.proxy(stash, 'snapshot')
  @stash.delete = $.proxy(stash, 'delete')
  @stash.restore = $.proxy(stash, 'restore')
  @stash.get = $.proxy(stash, 'get')
  @stash.list = $.proxy(stash, 'list')


  # Events
  # ------

  @ready = chainable(document.ready, 'add')
  @snippetFocused = chainable(focus.snippetFocus, 'add')
  @snippetBlurred = chainable(focus.snippetBlur, 'add')
  @textSelection = chainable(editableController.selection, 'add')


  # Help & Documentation
  # --------------------

  # Print the content of the snippetTree in a readable string
  @printTree = $.proxy(document, 'printTree')

  # Print a list of all available snippets
  @listTemplates = $.proxy(document, 'listTemplates')

  # Get help about a snippet
  # @param identifier: (String) snippet identifier e.g. "bootstrap.title"
  @help = $.proxy(document, 'help')


  # For Plugins & Extensions
  # ------------------------

  # enable snippet finder plugins
  @fn = SnippetArray::


  # Debugging & Development
  # -----------------------

  @document = document

  @readableJson = ->
    S.readableJson(document.toJson())

).call(doc)



