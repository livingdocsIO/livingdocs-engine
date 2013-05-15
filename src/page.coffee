# page
# ----
# The page implements the main API to a livingdocs document.

page = do ->

  setup: ({ rootNode, snippetTree } = {}) ->
    if !rootNode
      rootNode = $(".doc-section").first()
    else
      rootNode.addClass(".doc-section")

    @tree = snippetTree || new SnippetTree(root: snippetTree)


# auto-initialization
$(document).ready ->
  page.setup()
