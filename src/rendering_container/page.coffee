RenderingContainer = require('./rendering_container')
CssLoader = require('./css_loader')
config = require('../configuration/defaults')

# A Page is a subclass of RenderingContainer which is intended to be shown to
# the user. It has a Loader which allows you to inject CSS and JS files into the
# page.
module.exports = class Page extends RenderingContainer

  constructor: ({ renderNode, readOnly, hostWindow, @design }={}) ->
    @isReadOnly = readOnly if readOnly?
    @setWindow(hostWindow)

    super()

    renderNode ?= $(".#{ config.html.css.section }", @$body)
    if renderNode.jquery
      @renderNode = renderNode[0]
    else
      @renderNode = renderNode


  beforeReady: ->
    @cssLoader = new CssLoader(@window)
    @cssLoader.load(@design.css, @readySemaphore.wait()) if @design?.css


  setWindow: (hostWindow) ->
    @window = hostWindow || window
    @document = @window.document
    @$document = $(@document)
    @$body = $(@document.body)
