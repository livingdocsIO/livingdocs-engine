# Snippet
# -------
# Snippets are more or less the equivalent to nodes in the DOM tree.
# Each snippet has a SnippetTemplate which allows to generate HTML
# from a snippet or generate a snippet instance from HTML.
#
# Represents a node in a SnippetTree.
# Every snippet can have a parent (SnippetContainer),
# siblings (other snippets) and multiple containers (SnippetContainers).
#
# The containers are the parents of the child Snippets.
# E.g. a grid row would have as many containers as it has
# columns
#
# # @prop parentContainer: parent SnippetContainer

class Snippet

  constructor: ({ @template, @$snippet, parentContainer } = {}) ->
    if !@template
      error("cannot instantiate snippet without template reference")

    @identifier = @template.identifier
    @setParent(parentContainer) if parentContainer
    @next = undefined
    @previous = undefined


  setParent: (parentContainer) ->
    @parentContainer = parentContainer
    @snippetTree = parentContainer?.snippetTree
    this #chaining


  addContainer: (snippetContainer) ->
    error("SnippetContainer must have a name") if !snippetContainer.name
    @containers ||= {}
    @containers[snippetContainer.name] = snippetContainer
    this #chaining


  before: (snippet) ->
    if snippet
      snippet = @parentContainer.attachSnippet(snippet)
      snippet.previous = @previous
      snippet.next = this
      @previous = snippet

      if snippet.isFirst()
        @parentContainer.first = snippet

      this #chaining
    else
      @previous


  after: (snippet) ->
    if snippet
      snippet = @parentContainer.attachSnippet(snippet)
      snippet.previous = this
      snippet.next = @next
      @next = snippet

      if snippet.isLast()
        @parentContainer.last = snippet

      this #chaining
    else
      @next


  append: (containerName, snippet) ->
    @containers[containerName].append(snippet)
    this #chaining


  prepend: (containerName, snippet) ->
    @containers[containerName].prepend(snippet)
    this #chaining


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


  # get the parent snippet
  parent: () ->
     @parentContainer?.parentSnippet


