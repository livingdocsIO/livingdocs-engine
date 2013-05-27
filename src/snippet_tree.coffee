# SnippetTree
# -----------
# Livingdocs equivalent to the DOM tree.
# A snippet tree containes all the snippets of a page in hierarchical order.
#
# The root of the SnippetTree is a SnippetContainer. A SnippetContainer
# contains a list of snippets.
#
# snippets can have multible SnippetContainers themselves.
#
# ### Example:
#     - SnippetContainer (root)
#       - snippet 'Hero'
#       - snippet '2 Columns'
#         - SnippetContainer 'main'
#           - snippet 'Title'
#         - SnippetContainer 'sidebar'
#           - snippet 'Info-Box''
#
# ### Events:
# The first set of SnippetTree Events are concerned with layout changes like
# adding, removing or moving snippets.
#
# Consider: Have a documentFragment as the rootNode if no rootNode is given
# maybe this would help simplify some code (since snippets are always
# attached to the DOM).

class SnippetTree

  constructor: ({ content, rootNode } = {}) ->
    @root = new SnippetContainer($domNode: $(rootNode), snippetTree: this)
    @history = new History()
    @initializeEvents()

    # link the snippet tree with a DOM node
    @link(rootNode) if rootNode


  initializeEvents: () ->
    # ready event: fires once a SnippetTree is linked to its DOM node
    # and initialized
    @ready = $.Callbacks("memory once")

    # layout changes
    @snippetAdded = $.Callbacks()
    @snippetRemoved = $.Callbacks()
    @snippetMoved = $.Callbacks()
    # snippetContainerMoved: $.Callbacks()

    # content changes
    @snippetContentChanged = $.Callbacks()
    @snippetHtmlChanged = $.Callbacks()
    @snippetSettingsChanged = $.Callbacks()


  # attach a SnippetTree to its DOM root node
  # @param overwriteContent: force rendering of the SnippetTree (overwrite html in rootNode)
  link: (rootNode, overwriteContent) ->
    @root.$domNode = $(rootNode)
    @root.$domNode.html("") if overwriteContent



    if !@root.$domNode.children().length
      # render SnippetTree from scratch
      # consider: replace $domNode with a documentFragment and reswap after
      # everything is inserted (but I don't know if this is actually faster)

      @each (snippet) ->
        # snippet.insertIntoDom()
        # todo:

    else
      # initialize while leaving the exisitng Html as is

      # todo: parse DOM and check if has exactly the same structure
      # as the SnippetTree

      # todo: init snippets and editables

    @ready.fire(this)


  # Traverse the whole snippet tree.
  # Depth first: in the order of html source code appearance
  each: (callback) ->
    walker = (snippet) ->
      callback(snippet)

      # traverse children
      for name, snippetContainer of snippet.containers
        walker(snippetContainer.first) if snippetContainer.first

      # traverse siblings
      walker(snippet.next) if snippet.next

    walker(@root.first) if @root.first


  # insert snippet at the beginning
  prepend: (snippet) ->
    @root.prepend(snippet)
    # snippet.insertIntoDom()

    @ #chaining


  # insert snippet at the end
  append: (snippet) ->
    @root.append(snippet)
    # snippet.insertIntoDom()

    @ #chaining


  # returns a readable string representation of the whole tree
  print: () ->
    output = "SnippetTree\n-----------\n"

    addLine = (text, indentation = 0) ->
      output += "#{ Array(indentation + 1).join(" ") }#{ text }\n"

    walker = (snippet, indentation = 0) ->
      template = snippet.template
      addLine("- #{ template.title } (#{ template.identifier })", indentation)

      # traverse children
      for name, snippetContainer of snippet.containers
        addLine("#{ name }:", indentation + 2)
        walker(snippetContainer.first, indentation + 4) if snippetContainer.first

      # traverse siblings
      walker(snippet.next, indentation) if snippet.next

    walker(@root.first) if @root.first
    return output


  # returns a JSON representation of the whole tree
  toJson: () ->
    #todo

