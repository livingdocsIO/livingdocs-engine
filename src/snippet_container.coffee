# SnippetContainer
# ----------------

class SnippetContainer

  constructor: ({ @parent, @$domNode, @snippetTree, @name }) ->
    @first = @last = undefined


  # insert snippet at the beginning
  # @param snippet: Snippet or SnippetNode instance
  prepend: (snippet) ->
    snippetNode = @attachSnippet(snippet)

    if @first
      @first.before(snippetNode)
    else
      @last = snippetNode

    @first = snippetNode
    @ #chaining


  # insert snippet at the end
  # @param snippet: Snippet or SnippetNode instance
  append: (snippet) ->
    snippetNode = @attachSnippet(snippet)

    if @last
      @last.after(snippetNode)
    else
      @first = snippetNode

    @last = snippetNode

    @ #chaining


  # set SnippetNode parent of snippet
  # @return SnippetNode
  attachSnippet: (snippet) ->
    if snippet instanceof SnippetNode
      snippet.setParent(this)
    else if snippet instanceof Snippet
      if snippet.snippetNode
        snippet.snippetNode.setParent(this)
      else
        new SnippetNode(parentContainer: this, snippet: snippet)
    else
      error("incompatible type: param snippet")

