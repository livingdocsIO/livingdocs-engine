assert = require('./modules/logging/assert')
RenderingContainer = require('./rendering_container/rendering_container')
Page = require('./rendering_container/page')
InteractivePage = require('./rendering_container/interactive_page')
Renderer = require('./rendering/renderer')
View = require('./rendering/view')
EventEmitter = require('wolfy87-eventemitter')
config = require('./configuration/config')
dom = require('./interaction/dom')

module.exports = class Document extends EventEmitter


  constructor: ({ snippetTree }) ->
    @design = snippetTree.design
    @setSnippetTree(snippetTree)
    @views = {}
    @interactiveView = undefined


  # Get a drop target for an event
  getDropTarget: ({ event }) ->
    document = event.target.ownerDocument
    { clientX, clientY } = event
    elem = document.elementFromPoint(clientX, clientY)
    if elem?
      coords = { left: event.pageX, top: event.pageY }
      target = dom.dropTarget(elem, coords)


  setSnippetTree: (snippetTree) ->
    assert snippetTree.design == @design,
      'SnippetTree must have the same design as the document'

    @model = @snippetTree = snippetTree
    @forwardSnippetTreeEvents()


  forwardSnippetTreeEvents: ->
    @snippetTree.changed.add =>
      @emit 'change', arguments


  createView: (parent, options={}) ->
    parent ?= window.document.body
    options.readOnly ?= true

    $parent = $(parent).first()

    options.$wrapper ?= @findWrapper($parent)
    $parent.html('') # empty container

    view = new View(@snippetTree, $parent[0])
    promise = view.create(options)

    if view.isInteractive
      @setInteractiveView(view)

    promise


  # Append the article to the DOM.
  #
  # @param { DOM Node, jQuery object or CSS selector string } Where to append the article in the document.
  # @param { Object } options:
  #   interactive: { Boolean } Whether the document is edtiable.
  #   loadAssets: { Boolean } Load CSS files. Only disable this if you are sure you have loaded everything manually.
  #
  # Example:
  # article.appendTo('.article', { interactive: true, loadAssets: false });
  appendTo: (parent, options={}) ->
    $parent = $(parent).first()
    options.$wrapper ?= @findWrapper($parent)
    $parent.html('') # empty container

    view = new View(@snippetTree, $parent[0])
    view.createRenderer({ options })



  # A view sometimes has to be wrapped in a container.
  #
  # Example:
  # Here the document is rendered into $('.doc-section')
  # <div class="iframe-container">
  #   <section class="container doc-section"></section>
  # </div>
  findWrapper: ($parent) ->
    if $parent.find(".#{ config.css.section }").length == 1
      $wrapper = $($parent.html())

    $wrapper


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
    @snippetTree.serialize()


  toJson: (prettify) ->
    data = @serialize()
    if prettify?
      replacer = null
      space = 2
      JSON.stringify(data, replacer, space)
    else
      JSON.stringify(data)


  # Debug
  # -----

  # Print the SnippetTree.
  printModel: () ->
    @snippetTree.print()


  Document.dom = dom


