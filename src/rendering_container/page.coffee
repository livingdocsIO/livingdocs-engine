RenderingContainer = require('./rendering_container')
CssLoader = require('./css_loader')
config = require('../configuration/config')

# A Page is a subclass of RenderingContainer which is intended to be shown to
# the user. It has a Loader which allows you to inject CSS and JS files into the
# page.
module.exports = class Page extends RenderingContainer

  constructor: ({ renderNode, readOnly, hostWindow, @design, @snippetTree, @loadResources }={}) ->
    @isReadOnly = readOnly if readOnly?
    @renderNode = if renderNode?.jquery then renderNode[0] else renderNode
    @setWindow(hostWindow)
    @renderNode ?= $(".#{ config.css.section }", @$body)

    super()

    @cssLoader = new CssLoader(@window)
    @cssLoader.disable() if not @shouldLoadResources()
    @beforePageReady()


  beforeReady: ->
    # always initialize a page asynchronously
    @readySemaphore.wait()
    setTimeout =>
      @readySemaphore.decrement()
    , 0


  shouldLoadResources: ->
    if @loadResources?
      Boolean(@loadResources)
    else
      Boolean(config.loadResources)


  beforePageReady: =>
    if @design?
      designPath = "#{ config.designPath }/#{ @design.name }"
      cssLocation = if @design.css?
        @design.css
      else
        '/css/style.css'

      path = "#{ designPath }#{ cssLocation }"
      @cssLoader.load(path, @readySemaphore.wait())


  setWindow: (hostWindow) ->
    hostWindow ?= @getParentWindow(@renderNode)
    @window = hostWindow
    @document = @window.document
    @$document = $(@document)
    @$body = $(@document.body)


  getParentWindow: (elem) ->
    if elem?
      elem.ownerDocument.defaultView
    else
      window
