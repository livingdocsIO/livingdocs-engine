# TreeNode Mixin
# --------------

TreeNode = do ->

  parent: undefined
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

