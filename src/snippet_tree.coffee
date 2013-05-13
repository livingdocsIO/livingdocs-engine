# SnippetTree
# -----------
# Livingdocs equivalent to the DOM tree.
# A snippet tree containes all the snippets of a page in hierarchical order.

class SnippetTree

  constructor: () ->
    @root = {}
    @history = new History()


  # insert snippet at the beginning
  prepend: (snippet) ->
    #todo
    @ #chaining

  # insert snippet at the end
  append: (snippet) ->
    #todo
    @ #chaining


  # returns a readable string representation
  toString: () ->
    #todo


  # returns a JSON representation of the whole tree
  toJson: () ->
    #todo

