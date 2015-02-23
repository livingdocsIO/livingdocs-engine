$ = require('jquery')
RenderingContainer = require('./rendering_container')
Assets = require('./assets')
config = require('../configuration/config')

# A Page is a subclass of RenderingContainer which is intended to be shown to
# the user. It has a Loader which allows you to inject CSS and JS files into the
# page.
module.exports = class Page extends RenderingContainer

  constructor: ({ renderNode, readOnly, hostWindow, @documentDependencies, @design, @componentTree, @loadResources }={}) ->
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
      deps = @design.dependencies
      @assets.loadDependencies(deps.js, deps.css, @readySemaphore.wait())

    # Then load document specific dependencies
    if @documentDependencies?
      deps = @documentDependencies
      @assets.loadDependencies(deps.js, deps.css, @readySemaphore.wait())

      # listen for new dependencies
      @documentDependencies.dependenciesAdded.add (jsDependencies, cssDependencies) =>
        @assets.loadDependencies(jsDependencies, cssDependencies, ->)

      # listen for dependencies to execute once
      @documentDependencies.dependencyToExecute.add (dependency) =>
        @assets.loadDependency(dependency)

      @documentDependencies.codeToExecute.add (callback) =>
        callback(@window)


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

