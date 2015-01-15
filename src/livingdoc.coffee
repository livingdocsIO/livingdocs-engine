assert = require('./modules/logging/assert')
RenderingContainer = require('./rendering_container/rendering_container')
Page = require('./rendering_container/page')
InteractivePage = require('./rendering_container/interactive_page')
Renderer = require('./rendering/renderer')
View = require('./rendering/view')
EventEmitter = require('wolfy87-eventemitter')
config = require('./configuration/config')
dom = require('./interaction/dom')
designCache = require('./design/design_cache')
ComponentTree = require('./component_tree/component_tree')
Dependencies = require('./rendering/dependencies')

module.exports = class Livingdoc extends EventEmitter


  # Create a new livingdoc in a synchronous way.
  # The design must be loaded first.
  #
  # Call Options:
  # - new({ data })
  #   Load a livingdoc with JSON data
  #
  # - new({ design })
  #   This will create a new empty livingdoc with your
  #   specified design
  #
  # - new({ componentTree })
  #   This will create a new livingdoc from a
  #   componentTree
  #
  # @param data { json string } Serialized Livingdoc
  # @param designName { string } Name of a design
  # @param componentTree { ComponentTree } A componentTree instance
  # @returns { Livingdoc object }
  @create: ({ data, designName, componentTree }) ->
    componentTree = if data?
      designName = data.design?.name
      assert designName?, 'Error creating livingdoc: No design is specified.'
      design = designCache.get(designName)
      new ComponentTree(content: data, design: design)
    else if designName?
      design = designCache.get(designName)
      new ComponentTree(design: design)
    else
      componentTree

    new Livingdoc({ componentTree })


  constructor: ({ componentTree }) ->
    @design = componentTree.design

    @componentTree = undefined
    @dependencies = undefined
    @setComponentTree(componentTree)

    @interactiveView = undefined
    @additionalViews = []


  # Get a drop target for an event
  getDropTarget: ({ event }) ->
    document = event.target.ownerDocument
    { clientX, clientY } = event
    elem = document.elementFromPoint(clientX, clientY)
    if elem?
      coords = { left: event.pageX, top: event.pageY }
      target = dom.dropTarget(elem, coords)


  setComponentTree: (componentTree) ->
    assert componentTree.design == @design,
      'ComponentTree must have the same design as the document'

    @model = @componentTree = componentTree
    @dependencies = new Dependencies({ @componentTree })
    @forwardComponentTreeEvents()


  forwardComponentTreeEvents: ->
    @componentTree.changed.add =>
      @emit 'change', arguments


  createView: (parent, options={}) ->
    parent ?= window.document.body
    options.readOnly ?= true

    $parent = $(parent).first()

    options.$wrapper ?= @findWrapper($parent)
    $parent.html('') # empty container

    view = new View(this, $parent[0])
    whenViewIsReady = view.create(options)

    if view.isInteractive
      @setInteractiveView(view)
      whenViewIsReady.then ({ iframe, renderer }) =>
        @componentTree.setMainView(view)

    whenViewIsReady


  createComponent: ->
    @componentTree.createComponent.apply(@componentTree, arguments)


  # Append the article to the DOM.
  #
  # @param { DOM Node, jQuery object or CSS selector string } Where to append the article in the document.
  # @param { Object } options:
  #   interactive: { Boolean } Whether the document is edtiable.
  #   loadAssets: { Boolean } Load Js and CSS files.
  #     Only disable this if you are sure you have loaded everything manually.
  #
  # Example:
  # article.appendTo('.article', { interactive: true, loadAssets: false });
  appendTo: (parent, options={}) ->
    $parent = $(parent).first()
    options.$wrapper ?= @findWrapper($parent)
    $parent.html('') # empty container

    view = new View(this, $parent[0])
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
      'Error creating interactive view: Livingdoc can have only one interactive view'

    @interactiveView = view


  addDependency: (obj) ->
    @dependencies.add(obj)


  addJsDependency: (obj) ->
    @dependencies.addJs(obj)


  addCssDependency: (obj) ->
    @dependencies.addCss(obj)


  hasDependencies: ->
    @dependencies?.hasEntries()


  toHtml: ({ excludeComponents }={}) ->
    new Renderer(
      componentTree: @componentTree
      renderingContainer: new RenderingContainer()
      excludeComponents: excludeComponents
    ).html()


  serialize: ->
    @componentTree.serialize()


  toJson: (prettify) ->
    data = @serialize()
    if prettify?
      replacer = null
      indentation = 2
      JSON.stringify(data, replacer, indentation)
    else
      JSON.stringify(data)


  # Debug
  # -----

  # Print the ComponentTree.
  printModel: () ->
    @componentTree.print()


  Livingdoc.dom = dom


