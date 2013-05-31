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


  constructor: ({ @template, @$snippet } = {}) ->
    if !@template
      error("cannot instantiate snippet without template reference")

    @$snippet.data("snippet", this) if @$snippet

    @identifier = @template.identifier
    @next = undefined
    @previous = undefined


  addContainer: (snippetContainer) ->
    error("SnippetContainer must have a name") if !snippetContainer.name
    @containers ||= {}
    @containers[snippetContainer.name] = snippetContainer

    this


  before: (snippet) ->
    if snippet
      @parentContainer.insertBefore(this, snippet)
      this
    else
      @previous


  after: (snippet) ->
    if snippet
      @parentContainer.insertAfter(this, snippet)
      this
    else
      @next


  append: (containerName, snippet) ->
    @containers[containerName].append(snippet)
    this


  prepend: (containerName, snippet) ->
    @containers[containerName].prepend(snippet)
    this


  # move up (previous)
  up: ->
    @parentContainer.up(this)
    this


  # move down (next)
  down: ->
    @parentContainer.down(this)
    this


  # remove TreeNode from its container and SnippetTree
  remove: ->
    @parentContainer.remove(this)


  getParent: ->
     @parentContainer?.parentSnippet


  # Iterators
  # ---------

  parents: (callback) ->
    snippet = this
    while (snippet = snippet.getParent())
      callback(snippet)


  children: (callback) ->
    for name, snippetContainer of @containers
      snippet = snippetContainer.first
      while (snippet)
        callback(snippet)
        snippet = snippet.next


  descendants: (callback) ->
    for name, snippetContainer of @containers
      snippet = snippetContainer.first
      while (snippet)
        snippet.descendants(callback)
        callback(snippet)
        snippet = snippet.next


  descendantsAndSelf: (callback) ->
    callback(this)
    @descendants(callback)


  childrenAndSelf: (callback) ->
    callback(this)
    @children(callback)

