# Public API
# ----------
# Since the livingdocs-engine code is contained in its own function closure
# we expose our public API here explicitly.
#
#
# `doc()`: primary function interface similar to jquery
# with snippet selectors and stuff...

@doc = (search) ->
  if search
    document.find(search)
  else
    doc #chaining


# Helper method to create chainable proxies.
# Works the same as $.proxy() *its mostly the same code ;)*
chainable = (fn, context) ->

  if typeof context == "string"
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

  # Initialize the document
  @loadDocument = chainable(document, "loadDocument")

  # Add SnippetTemplates to the documents
  @addSnippetCollection = chainable(document, "addSnippetCollection")

  # Append a snippet to the document
  # @param input: (String) snippet identifier e.g. "bootstrap.title" or (Snippet)
  # @return Snippet
  @add = $.proxy(document, "add")

  # Create a new snippet instance (not inserted into the document)
  # @param identifier: (String) snippet identifier e.g. "bootstrap.title"
  # @return Snippet
  @create = $.proxy(document, "createSnippet")

  # Get help about a snippet
  # @param identifier: (String) snippet identifier e.g. "bootstrap.title"
  @help = $.proxy(document, "help")

  # Print the content of the snippetTree in a readable string
  @printTree = $.proxy(document, "printTree")

  # Print a list of all available snippets
  @listSnippets = $.proxy(document, "listSnippets")

  @ready = chainable(document.ready, "add")

  @document = document

).call(doc)




