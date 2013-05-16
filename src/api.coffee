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

  @loadDocument = chainable(document, "loadDocument")
  @addSnippetCollection = chainable(document, "addSnippetCollection")
  @add = chainable(document, "add")
  @document = document

).call(doc)




