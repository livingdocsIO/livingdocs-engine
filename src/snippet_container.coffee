# SnippetContainer
# ----------------
#
# @prop parentSnippet: parent Snippet

class SnippetContainer

  constructor: ({ @parentSnippet, @$domNode, @snippetTree, @name }) ->
    @first = @last = undefined


  # insert snippet at the beginning
  prepend: (snippet) ->
    snippet = @attachSnippet(snippet)

    if @first
      @first.before(snippet)
    else
      @last = snippet

    @first = snippet
    @ #chaining


  # insert snippet at the end
  append: (snippet) ->
    snippet = @attachSnippet(snippet)

    if @last
      @last.after(snippet)
    else
      @first = snippet

    @last = snippet

    @ #chaining


  # set this container as the parent of a snippet
  # @return Snippet
  attachSnippet: (snippet) ->
    snippet.setParent(this)

