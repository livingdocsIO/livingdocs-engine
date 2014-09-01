RenderingContainer = require('./rendering_container')
CssLoader = require('./css_loader')
config = require('../configuration/config')

# A Page is a subclass of RenderingContainer which is intended to be shown to
# the user. It has a Loader which allows you to inject CSS and JS files into the
# page.
module.exports = class Page extends RenderingContainer

  constructor: ({ renderNode, readOnly, hostWindow, @design, @snippetTree }={}) ->
    @isReadOnly = readOnly if readOnly?
    @setWindow(hostWindow)

    super()

    @setRenderNode(renderNode)
    @cssLoader = new CssLoader(@window)
    @beforePageReady()


  setRenderNode: (renderNode) ->
    renderNode ?= $(".#{ config.css.section }", @$body)
    if renderNode.jquery
      @renderNode = renderNode[0]
    else
      @renderNode = renderNode


  beforeReady: ->
    # always initialize a page asynchronously
    @readySemaphore.wait()
    setTimeout =>
      @readySemaphore.decrement()
    , 0


  beforePageReady: =>
    if @design? && config.loadResources
      designPath = "#{ config.designPath }/#{ @design.namespace }"
      cssLocation = if @design.css?
        @design.css
      else
        '/css/style.css'

      path = "#{ designPath }#{ cssLocation }"
      @cssLoader.load(path, @readySemaphore.wait())


  setWindow: (hostWindow) ->
    @window = hostWindow || window
    @document = @window.document
    @$document = $(@document)
    @$body = $(@document.body)
