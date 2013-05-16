# page
# ----
# Defines the API between the DOM and the document

page = do ->

  # initialize document sections
  #
  # @params
  # - rootNode (optional) DOM node that should contain the content
  initializeSection: ({ rootNode, snippetTree } = {}) ->
    error("no snippet tree specified") if !snippetTree

    if !rootNode
      @$root = $(".doc-section").first()
    else
      @$root = $(rootNode).addClass(".doc-section")

    error("no rootNode found") if !@$root.length

    snippetTree?.link(@$root)

