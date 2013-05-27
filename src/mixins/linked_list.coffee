# TreeNode Mixin
# --------------
# Represents a node in a SnippetTree
#
# Every node has a parent node, possibly siblings and multiple
# ChildContainers. ChildContainers are the parents of the
# child nodes, not the TreeNode itself.
#
# E.g. a grid row would have as many ChildContainers as it has
# columns

LinkedList = do ->

  next: undefined
  previous: undefined

  before: (node) ->
    if node
      node.previous = @previous
      node.next = this
      @previous = node
      @ #chaining
    else
      @previous


  after: (node) ->
    if node
      node.previous = this
      node.next = @next
      @next = node
      @ #chaining
    else
      @next


  remove: () ->
    @next?.previous = @previous
    @previous?.next = @next
    @ #chaining

