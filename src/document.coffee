assert = require('./modules/logging/assert')
Design = require('./design/design')
SnippetTree = require('./snippet_tree/snippet_tree')
Kickstart = require('./kickstart/kickstart')

RenderingContainer = require('./rendering_container/rendering_container')
Page = require('./rendering_container/page')
InteractivePage = require('./rendering_container/interactive_page')
Renderer = require('./rendering/renderer')
View = require('./rendering/view')

# Document
# --------
# Manage the document and its dependencies.
# Initialze everyting.
#
# ### Design:
# Manage available Templates
#
# ### Assets:
# Load and manage CSS and Javascript dependencies
# of the designs
#
# ### Content:
# Initialize the SnippetTree.
#
# ### Page:
# Initialize event listeners.
# Link the SnippetTree with the DomTree.
module.exports = do ->

  # Document object
  # ---------------

  initialized: false
  uniqueId: 0
  ready: $.Callbacks('memory once')
  changed: $.Callbacks()


  # *Public API*
  init: ({ design, json, rootNode }={}) ->
    assert not @initialized, 'document is already initialized'
    @initialized = true
    @design = new Design(design)

    @snippetTree = if json && @design
      new SnippetTree(content: json, design: @design)
    else
      new SnippetTree()

    # forward changed event
    @snippetTree.changed.add =>
      @changed.fire()

    # Page initialization
    @page = new InteractivePage
      renderNode: rootNode
      design: @design
      snippetTree: @snippetTree

    # render document
    @renderer = new Renderer
      snippetTree: @snippetTree
      renderingContainer: @page

    @renderer.ready => @ready.fire()


  createView: (parent=window.document.body) ->
    view = new View(@snippetTree, parent)
    view.create(readOnly: true)


  eachContainer: (callback) ->
    @snippetTree.eachContainer(callback)


  # *Public API*
  add: (input) ->
    @snippetTree.append(snippet)
    snippet


  # *Public API*
  createModel: (identifier) ->
    @snippetTree.createModel(identifier)


  # find all instances of a certain Template
  # e.g. search "bootstrap.hero" or just "hero"
  find: (search) ->
    @snippetTree.find(search)


  # print the SnippetTree
  printTree: () ->
    @snippetTree.print()


  toJson: ->
    json = @snippetTree.toJson()
    json['meta'] =
      title: undefined
      author: undefined
      created: undefined
      published: undefined

    json


  toHtml: ->
    new Renderer(
      snippetTree: @snippetTree
      renderingContainer: new RenderingContainer()
    ).html()


  restore: (contentJson, resetFirst = true) ->
    @reset() if resetFirst
    @snippetTree.fromJson(contentJson, @design)
    @renderer.render()


  reset: ->
    @renderer.clear()
    @snippetTree.detach()


  kickstart: ({ xmlTemplate, scriptNode, destination, design}) ->
    json = new Kickstart({xmlTemplate, scriptNode, design}).getSnippetTree().toJson()
    @init({ design, json, rootNode: destination })
