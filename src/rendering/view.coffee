Renderer = require('./renderer')
Page = require('../rendering_container/page')
InteractivePage = require('../rendering_container/interactive_page')

module.exports = class View

  constructor: (@componentTree, @parent) ->
    @parent ?= window.document.body
    @isInteractive = false


  # Available Options:
  # ReadOnly view: (default if nothing is specified)
  # create(readOnly: true)
  #
  # Ineractive view:
  # create(interactive: true)
  #
  # Wrapper: (DOM node that has to contain a node with class '.doc-section')
  # create( $wrapper: $('<section class="container doc-section">') )
  create: (options) ->
    @createIFrame(@parent).then (iframe, renderNode) =>
      @iframe = iframe
      renderer = @createIFrameRenderer(iframe, options)
      iframe: iframe
      renderer: renderer


  createIFrame: (parent) ->
    deferred = $.Deferred()

    iframe = parent.ownerDocument.createElement('iframe')
    iframe.src = 'about:blank'
    iframe.setAttribute('frameBorder', '0')
    iframe.onload = -> deferred.resolve(iframe)

    parent.appendChild(iframe)
    deferred.promise()


  createIFrameRenderer: (iframe, options) ->
    @createRenderer
      renderNode: iframe.contentDocument.body
      options: options


  createRenderer: ({ renderNode, options }={}) ->
    params =
      renderNode: renderNode || @parent
      design: @componentTree.design

    @page = @createPage(params, options)

    new Renderer
      renderingContainer: @page
      componentTree: @componentTree
      $wrapper: options.$wrapper


  createPage: (params, { interactive, readOnly, loadResources }={}) ->
    params ?= {}
    params.loadResources = loadResources
    if interactive?
      @isInteractive = true
      new InteractivePage(params)
    else
      new Page(params)

