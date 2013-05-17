# SnippetTree
# -----------
# Livingdocs equivalent to the DOM tree.
# A snippet tree containes all the snippets of a page in hierarchical order.
# The tree can be linked with a DOM node that functions as the container of
# all the snippets.

class SnippetTree

  constructor: ({ content, rootNode } = {}) ->
    @first = @last = undefined
    @history = new History()

    # link the snippet tree with a DOM node
    @link(rootNode) if rootNode


  link: (rootNode) ->
    @$root = $(rootNode)

    #todo: parse contents instead of just deleting them
    @$root.html()


  # Traverse the whole snippet tree.
  # Depth first: in the order of html source code appearance
  each: (callback) ->

    walker = (snippet) ->
      callback(snippet)

      #todo: walk children

      if snippet.next
        walker(snippet.next)

    walker(@first) if @first


  # insert snippet at the beginning
  prepend: (snippet) ->
    if @first
      @first.before(snippet)
      snippet.insertIntoDom()
    else
      @last = snippet
      snippet.insertIntoDom(@$root)

    @first = snippet
    @ #chaining


  # insert snippet at the end
  append: (snippet) ->
    if @last
      @last.after(snippet)
      snippet.insertIntoDom()
    else
      @first = snippet
      snippet.insertIntoDom(@$root)

    @last = snippet

    @ #chaining


  root: (rootNode) ->
    if rootNode
      @_rootNode = rootNode
    else
      @_rootNode


  # returns a readable string representation
  toString: () ->
    #todo


  # returns a JSON representation of the whole tree
  toJson: () ->
    #todo

