# Snippet
# -------
# Snippets are more or less the equivalent to nodes in the DOM tree.
# Each snippet has a SnippetTemplate which allows to generate HTML
# from a snippet or generate a snippet instance from HTML.

class Snippet extends mixins TreeNode

  snippetTree: undefined
  template: undefined


  constructor: ({ @template }) ->
    #test


  remove: () ->
    #todo
    @ #chaining


  # return an array of all parent snippets in snippetTree
  # (starting from the top)
  parents: () ->
    #todo


  # a snippet is detached if it is not contained by a snippetTree
  isDetached: () ->
    !snippetTree?



