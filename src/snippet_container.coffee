# SnippetContainer
# ----------------

class SnippetContainer

  constructor: ({ @parent, @$domNode, @snippetTree }) ->
    @first = @last = undefined


  # insert snippet at the beginning
  # @param snippet: Snippet or SnippetTreeNode instance
  prepend: (snippet) ->
    snippetNode = @attachSnippet(snippet)

    if @first
      @first.before(snippetNode)
    else
      @last = snippetNode

    @first = snippetNode
    @ #chaining


  # insert snippet at the end
  # @param snippet: Snippet or SnippetTreeNode instance
  append: (snippet) ->
    snippetNode = @attachSnippet(snippet)

    if @last
      @last.after(snippetNode)
    else
      @first = snippetNode

    @last = snippetNode

    @ #chaining


  # set SnippetTreeNode parent of snippet
  # @return SnippetTreeNode
  attachSnippet: (snippet) ->
    if snippet instanceof SnippetTreeNode
      snippet.setParent(this)
    else if snippet instanceof Snippet
      if snippet.snippetTreeNode
        snippet.snippetTreeNode.setParent(this)
      else
        new SnippetTreeNode(parentContainer: this, snippet: snippet)
    else
      error("incompatible type: param snippet")

