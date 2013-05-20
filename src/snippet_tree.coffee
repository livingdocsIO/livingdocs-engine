# SnippetTree
# -----------
# Livingdocs equivalent to the DOM tree.
# A snippet tree containes all the snippets of a page in hierarchical order.
# The tree can be linked with a DOM node that functions as the container of
# all the snippets.

class SnippetTree

  constructor: ({ content, rootNode } = {}) ->
    @root = new SnippetContainer($domNode: $(rootNode), snippetTree: this)
    @history = new History()

    # link the snippet tree with a DOM node
    @link(rootNode) if rootNode


  link: (rootNode) ->
    @root.$domNode = $(rootNode)

  # Traverse the whole snippet tree.
  # Depth first: in the order of html source code appearance
  each: (callback) ->

    walker = (snippet) ->
      callback(snippet)

      #todo: walk children

      if snippet.next
        walker(snippet.next)

    walker(@root.first) if @root.first


  # insert snippet at the beginning
  prepend: (snippet) ->
    @root.prepend(snippet)
    snippet.insertIntoDom()

    @ #chaining


  # insert snippet at the end
  append: (snippet) ->
    @root.append(snippet)
    snippet.insertIntoDom()

    @ #chaining


  # returns a readable string representation
  print: () ->
    tree = []
    @each snippet ->
      tree.push snippet.identifier


  # returns a JSON representation of the whole tree
  toJson: () ->
    #todo

