# jQuery like results when searching for snippets.
# `doc("hero")` will return a SnippetArray that works similar to a jQuery object.
# For extensibility via plugins we expose the prototype of SnippetArray via `doc.fn`.
module.exports = class SnippetArray


  # @param snippets: array of snippets
  constructor: (@snippets) ->
    @snippets = [] unless @snippets?
    @createPseudoArray()


  createPseudoArray: () ->
    for result, index in @snippets
      @[index] = result

    @length = @snippets.length
    if @snippets.length
      @first = @[0]
      @last = @[@snippets.length - 1]


  each: (callback) ->
    for snippet in @snippets
      callback(snippet)

    this


  remove: () ->
    @each (snippet) ->
      snippet.remove()

    this
