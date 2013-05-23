# Snippet
# -------
# Snippets are more or less the equivalent to nodes in the DOM tree.
# Each snippet has a SnippetTemplate which allows to generate HTML
# from a snippet or generate a snippet instance from HTML.

class Snippet

  constructor: ({ @template, @$snippet } = {}) ->
    if !@template
      error("cannot instantiate snippet without template reference")

    @identifier = @template.identifier
    @snippetNode = undefined
    @snippetNodeChanged = false
    @attachedToDom = false

    # add a reference to the DOM
    @$snippet.data("snippet", this)


  # move up (previous)
  up: () ->
    @snippetNode.up()
    @updateDomPosition()
    this #chaining


  # move down (next)
  down: () ->
    @snippetNode.down()
    @updateDomPosition()
    this #chaining


  before: (snippet) ->
    if snippet
      @snippetNode.before(snippet)
      this #chaining
    else
      @snippetNode.before()?.snippet


  after: (snippet) ->
    if snippet
      @snippetNode.after(snippet)
      this #chaining
    else
      @snippetNode.after()?.snippet


  append: (containerName, snippet) ->
    @snippetNode.append(containerName, snippet)
    snippet.updateDomPosition()
    this #chaining


  prepend: (containerName, snippet) ->
    @snippetNode.prepend(containerName, snippet)
    snippet.updateDomPosition()
    this #chaining


  updateDomPosition: () ->
    @detachFromDom() if @attachedToDom
    @insertIntoDom()


  # insert the snippet into the Dom according to its position
  # in the SnippetTree
  insertIntoDom: () ->
    previous = @snippetNode.previous
    next = @snippetNode.next
    parentContainer = @snippetNode.parentContainer

    if !@attachedToDom
      if previous && previous.snippet.attachedToDom
        previous.snippet.$snippet.after(@$snippet)
        @afterDomInsert()
      else if next && next.snippet.attachedToDom
        next.snippet.$snippet.before(@$snippet)
        @afterDomInsert()
      else if parentContainer
        parentContainer.$domNode.append(@$snippet)
        @afterDomInsert()
      else
        error("could not insert snippet into Dom")

    this #chaining


  afterDomInsert: () ->
    @attachedToDom = true

    # initialize editables
    editableNodes = @$snippet.findIn("[#{ docAttr.editable }]")
    Editable.add(editableNodes)


  detachFromDom: () ->
    @$snippet.detach()
    @attachedToDom = false
    this #chaining


  removeFromDom: () ->
    if @attachedToDom
      @$snippet.remove()
      @attachedToDom = false

    this #chaining





