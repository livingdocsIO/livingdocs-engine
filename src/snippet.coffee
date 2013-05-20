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
    @snippetTreeNode = undefined
    @snippetTreeNodeChanged = false
    @attachedToDom = false

    if !@$snippet
      @$snippet = @template.createHtml()


  # move up (previous)
  up: () ->
    @snippetTreeNode.up()
    @updateDomPosition()
    this #chaining


  # move down (next)
  down: () ->
    @snippetTreeNode.down()
    @updateDomPosition()
    this #chaining


  updateDomPosition: () ->
    @detachFromDom() if @attachedToDom
    @insertIntoDom()

  # insert the snippet into the Dom according to its position
  # in the SnippetTree
  insertIntoDom: () ->
    previous = @snippetTreeNode.previous
    next = @snippetTreeNode.next
    parentContainer = @snippetTreeNode.parentContainer

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


  detachFromDom: () ->
    @$snippet.detach()
    @attachedToDom = false
    this #chaining


  removeFromDom: () ->
    if @attachedToDom
      @$snippet.remove()
      @attachedToDom = false

    this #chaining





