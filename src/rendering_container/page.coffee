$ = require('jquery')
RenderingContainer = require('./rendering_container')
Assets = require('./assets')
config = require('../configuration/config')

# A Page is a subclass of RenderingContainer which is intended to be shown to
# the user. It has a Loader which allows you to inject CSS and JS files into the
# page.
module.exports = class Page extends RenderingContainer

  constructor: ({ renderNode, readOnly, hostWindow, @design, @componentTree, @loadResources }={}) ->
    @loadResources ?= config.loadResources
    @isReadOnly = readOnly if readOnly?
    @renderNode = if renderNode?.jquery then renderNode[0] else renderNode
    @setWindow(hostWindow)
    @renderNode ?= $(".#{ config.css.section }", @$body)

    super()

    # Prepare assets
    preventAssetLoading = not @loadResources
    @assets = new Assets(window: @window, disable: preventAssetLoading)

    @loadAssets()


  beforeReady: ->
    # always initialize a page asynchronously
    @readySemaphore.wait()
    setTimeout =>
      @readySemaphore.decrement()
    , 0


  loadAssets: =>
    # First load design dependencies
    if @design?
      @assets.loadDependencies(@design.dependencies, @readySemaphore.wait())

    # Then load document specific dependencies
    # @livingdoc.dependencies


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

