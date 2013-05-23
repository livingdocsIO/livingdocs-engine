# SnippetNode
# ---------------
# Represents a node in a SnippetTree.
#
# Every snippetNode can have a parent (SnippetContainer),
# siblings (SnippetNodes) and multiple containers (SnippetContainer).
#
# The containers are the parents of the
# child SnippetNodes, not the SnippetNode itself.
#
# E.g. a grid row would have as many containers as it has
# columns
#
# # @prop parentContainer: parent SnippetContainer

class SnippetNode

  constructor: ({ parentContainer, snippet }) ->
    error("Missing param snippet") if !snippet?

    @setParent(parentContainer) if parentContainer
    @snippet = snippet
    @snippet.snippetNode = this
    @next = undefined
    @previous = undefined


  # return an array of all parents in snippetTree
  # (starting from the top)
  parents: () ->
    #todo


  setParent: (parentContainer) ->
    @parentContainer = parentContainer
    @snippetTree = parentContainer?.snippetTree
    this #chaining


  addContainer: (snippetContainer) ->
    error("SnippetContainer must have a name") if !snippetContainer.name
    @containers ||= {}
    @containers[snippetContainer.name] = snippetContainer
    this #chaining


  append: (containerName, snippet) ->
    @containers[containerName].append(snippet)
    this #chaining


  prepend: (containerName, snippet) ->
    @containers[containerName].prepend(snippet)
    this #chaining


  # @param snippet: Snippet or SnippetNode instance
  before: (snippet) ->
    if snippet
      treeNode = @parentContainer.attachSnippet(snippet)
      treeNode.previous = @previous
      treeNode.next = this
      @previous = treeNode

      if treeNode.isFirst()
        @parentContainer.first = treeNode

      this #chaining
    else
      @previous


  # @param snippet: Snippet or SnippetNode instance
  after: (snippet) ->
    if snippet
      treeNode = @parentContainer.attachSnippet(snippet)
      treeNode.previous = this
      treeNode.next = @next
      @next = treeNode

      if treeNode.isLast()
        @parentContainer.last = treeNode

      this #chaining
    else
      @next


  # move up (previous)
  up: () ->
    if @previous?
      previous = @previous
      @unlink()
      previous.before(this)

    this #chaining


  # move down (next)
  down: () ->
    if @next?
      next = @next
      @unlink()
      next.after(this)

    this #chaining


  isFirst: () ->
    !@previous?


  isLast: () ->
    !@next?


  # remove TreeNode from its container and SnippetTree
  unlink: () ->

    # update parentContainer links
    @parentContainer.first = @next if @isFirst()
    @parentContainer.last = @previous if @isLast()

    # update previous and next nodes
    @next?.previous = @previous
    @previous?.next = @next

    @previous = undefined
    @next = undefined
    @setParent(undefined)

    this #chaining


