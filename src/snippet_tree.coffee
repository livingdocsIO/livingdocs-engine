# SnippetTree
# -----------
# Livingdocs equivalent to the DOM tree.
# A snippet tree containes all the snippets of a page in hierarchical order.

class SnippetTree

  constructor: () ->
    @first = @last = undefined
    @history = new History()


  # insert snippet at the beginning
  prepend: (snippet) ->
    if @first
      @first.before(snippet)
    else
      @last = snippet

    @first = snippet
    @ #chaining

  # insert snippet at the end
  append: (snippet) ->
    if @last
      @last.after(snippet)
    else
      @first = snippet

    @last = snippet
    @ #chaining


  # returns a readable string representation
  toString: () ->
    #todo


  # returns a JSON representation of the whole tree
  toJson: () ->
    #todo

