Renderer = require('./renderer')
Page = require('../rendering_container/page')
InteractivePage = require('../rendering_container/interactive_page')

module.exports = class View

  # @param {Object}
  #   livingdoc {Livingdoc}
  #   parent {DOM Node} Where to append the iframe or html
  #   isInteractive {Boolean} Set to false to get a read-only livingdoc
  #   wrapper {DOM Node or jQuery Node} A DOM node that has to contain a node with class '.doc-section'
  #   loadResources {Boolean} Whether to load the design dependencies
  constructor: ({ @livingdoc, parent, @isInteractive, @wrapper, @loadResources }) ->
    @parent = if parent?.jquery then parent[0] else parent
    @parent ?= window.document.body
    @isInteractive ?= false
    @isReady = false
    @whenReadyDeferred = $.Deferred()
    @whenReady = @whenReadyDeferred.promise()


  # @param {Object}
  #   renderInIframe {Boolean} Whether to render the document in an iframe
  #
  # @returns {Promise}
  create: ({ renderInIframe }={})->
    if renderInIframe
      @createIFrame @parent, =>
        @addBaseTarget()
        @createIFrameRenderer()
        @isReady = true
        @whenReadyDeferred.resolve
          iframe: @iframe
          renderer: @renderer
    else
      @createRenderer(renderNode: @parent)
      @isReady = true
      @whenReadyDeferred.resolve(renderer: @renderer)

    @whenReady


  # Prevent links from opening in the iframe
  # Add <base target='_blank' />
  addBaseTarget: ->
    doc = @iframe.contentDocument
    base = doc.createElement('base')
    base.setAttribute('target', '_blank')
    doc.getElementsByTagName('head')[0].appendChild(base)


  # Private
  # -------

  createIFrame: (parent, callback) ->
    iframe = parent.ownerDocument.createElement('iframe')
    iframe.src = 'about:blank'
    iframe.setAttribute('frameBorder', '0')
    @iframe = iframe
    iframe.onload = -> callback(iframe)

    parent.appendChild(iframe)


  createIFrameRenderer: ->
    @createRenderer
      renderNode: @iframe.contentDocument.body


  # @returns {Renderer}
  createRenderer: ({ renderNode }={}) ->
    params =
      renderNode: renderNode || @parent
      documentDependencies: @livingdoc.dependencies
      design: @livingdoc.design
      loadResources: @loadResources

    @page = if @isInteractive
      new InteractivePage(params)
    else
      new Page(params)

    @renderer = new Renderer
      renderingContainer: @page
      componentTree: @livingdoc.componentTree
      $wrapper: $(@wrapper)

