# page
# ----
# The page implements the main API to a livingdocs document.

page = do ->

  initialize: ({ rootNode } = {}) ->
    rootNode ||= document

    $(rootNode).findIn(".doc-section").each (node) ->
      @tree = new SnippetTree()


# auto-initialization
$(document).ready ->
  page.initialize()
