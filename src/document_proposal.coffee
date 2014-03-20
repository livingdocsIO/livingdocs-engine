assert = require('./modules/logging/assert')
RenderingContainer = require('./rendering_container/rendering_container')
Page = require('./rendering_container/page')
InteractivePage = require('./rendering_container/interactive_page')
Renderer = require('./rendering/renderer')
View = require('./rendering/view')
EventEmitter = require('wolfy87-eventemitter')

module.exports = class Document extends EventEmitter


  constructor: ({ snippetTree }) ->
    @design = snippetTree.design
    @setSnippetTree(snippetTree)
    @views = {}
    @interactiveView = undefined


  setSnippetTree: (snippetTree) ->
    assert snippetTree.design == @design,
      'SnippetTree must have the same design as the document'

    @model = @snippetTree = snippetTree
    @forwardSnippetTreeEvents()


  forwardSnippetTreeEvents: ->
    @snippetTree.changed.add =>
      @emit 'change', arguments


  createView: (parent, options) ->
    parent ?= window.document.body
    options ?= readOnly: true
    view = new View(@snippetTree, parent)
    promise = view.create(options)

    if view.isInteractive?
      @setInteractiveView(view)

    promise


  setInteractiveView: (view) ->
    assert not @interactiveView?,
      'Error creating interactive view: Document can have only one interactive view'

    @interactiveView = view


  toHtml: ->
    new Renderer(
      snippetTree: @snippetTree
      renderingContainer: new RenderingContainer()
    ).html()


  serialize: ->
    data = @snippetTree.toJson()
    data['design'] = @design.namespace
    data



