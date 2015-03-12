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


  # @param {Object}
  #   renderInIframe {Boolean} Whether to render the document in an iframe
  #
  # @returns {Promise}
  create: ({ renderInIframe }={})->
    deferred = $.Deferred()

    if renderInIframe
      @createIFrame @parent, =>
        @createIFrameRenderer()
        deferred.resolve
          iframe: @iframe
          renderer: @renderer
    else
      @createRenderer(renderNode: @parent)
      deferred.resolve(renderer: @renderer)

    deferred.promise()


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

