Renderer = require('./renderer')
Page = require('../rendering_container/page')
InteractivePage = require('../rendering_container/interactive_page')

module.exports = class View

  constructor: (@snippetTree, @parent) ->
    @parent ?= window.document.body


  create: (options) ->
    @createIFrame(@parent).then (iframe) =>
      renderer = @createIFrameRenderer(iframe, options)

      iframe: iframe
      renderer: renderer


  createIFrame: (parent) ->
    deferred = $.Deferred()

    iframe = parent.ownerDocument.createElement('iframe')
    iframe.src = 'about:blank'
    iframe.onload = -> deferred.resolve(iframe)

    parent.appendChild(iframe)
    deferred.promise()


  createIFrameRenderer: (iframe, { interactive, readOnly }={}) ->
    params =
      renderNode: iframe.contentDocument.body
      hostWindow: iframe.contentWindow
      design: @snippetTree.design

    container = if interactive?
      new InteractivePage(params)
    else
      new Page(params)

    renderer = new Renderer
      renderingContainer: container
      snippetTree: @snippetTree
