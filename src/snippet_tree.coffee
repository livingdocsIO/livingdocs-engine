# SnippetTree
# -----------
# Livingdocs equivalent to the DOM tree.
# A snippet tree containes all the snippets of a page in hierarchical order.
#
# The root of the SnippetTree is a SnippetContainer. A SnippetContainer
# contains a list of SnippetNodes.
#
# SnippetNodes can have multible SnippetContainers themselves.
#
# ### Example:
#     - SnippetContainer (root)
#       - SnippetNode 'Hero'
#       - SnippetNode '2 Columns'
#         - SnippetContainer 'main'
#           - SnippetNode 'Title'
#         - SnippetContainer 'sidebar'
#           - SnippetNode 'Info-Box''

class SnippetTree

  constructor: ({ content, rootNode } = {}) ->
    @root = new SnippetContainer($domNode: $(rootNode), snippetTree: this)
    @history = new History()

    # link the snippet tree with a DOM node
    @link(rootNode) if rootNode


  link: (rootNode) ->
    @root.$domNode = $(rootNode)

  # Traverse the whole snippet tree.
  # Depth first: in the order of html source code appearance
  each: (callback) ->

    walker = (snippetNode) ->
      callback(snippetNode)

      # traverse children
      for name, snippetContainer of snippetNode.containers
        walker(snippetContainer.first) if snippetContainer.first

      # traverse siblings
      walker(snippetNode.next) if snippetNode.next

    walker(@root.first) if @root.first


  # insert snippet at the beginning
  prepend: (snippet) ->
    @root.prepend(snippet)
    snippet.insertIntoDom()

    @ #chaining


  # insert snippet at the end
  append: (snippet) ->
    @root.append(snippet)
    snippet.insertIntoDom()

    @ #chaining


  # returns a readable string representation of the whole tree
  print: () ->
    output = "SnippetTree\n-----------\n"

    addLine = (text, indentation = 0) ->
      output += "#{ Array(indentation + 1).join(" ") }#{ text }\n"

    walker = (snippetNode, indentation = 0) ->
      addLine("-#{ snippetNode.snippet.identifier }", indentation)

      # traverse children
      for name, snippetContainer of snippetNode.containers
        addLine("#{ name }:", indentation + 2)
        walker(snippetContainer.first, indentation + 4) if snippetContainer.first

      # traverse siblings
      walker(snippetNode.next, indentation) if snippetNode.next

    walker(@root.first) if @root.first
    return output


  # returns a JSON representation of the whole tree
  toJson: () ->
    #todo

