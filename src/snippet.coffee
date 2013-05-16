# Snippet
# -------
# Snippets are more or less the equivalent to nodes in the DOM tree.
# Each snippet has a SnippetTemplate which allows to generate HTML
# from a snippet or generate a snippet instance from HTML.

class Snippet extends mixins TreeNode

  snippetTree: undefined
  attachedToDom: false

  constructor: ({ @template, @$snippet } = {}) ->
    if !@template
      error("cannot instantiate snippet without template reference")

    # if !@$snippet
    #   @$snippet = @template.createHtml()

    @identifier = @template.identifier



  removeFromDom: () ->
    @$snippet.remove()
    @attachedToDom = false
    @ #chaining


  # return an array of all parent snippets in snippetTree
  # (starting from the top)
  parents: () ->
    #todo


  insertIntoDom: ($node) ->

    if !@attachedToDom
      if $node
        $node.append(@$snippet)
        @afterDomInsert()
      else if @previous && @previous.attachedToDom
        @previous.$snippet.after(@$snippet)
        @afterDomInsert()
      else if @next && @next.attachedToDom
        @next.$snippet.before(@$snippet)
        @afterDomInsert()

    @ #chaining


  afterDomInsert: () ->
    @attachedToDom = true





