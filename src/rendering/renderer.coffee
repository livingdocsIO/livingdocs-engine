$ = require('jquery')
assert = require('../modules/logging/assert')
log = require('../modules/logging/log')
Semaphore = require('../modules/semaphore')
config = require('../configuration/config')

module.exports = class Renderer

  # @param { Object }
  # - componentTree { ComponentTree }
  # - renderingContainer { RenderingContainer }
  # - $wrapper { jQuery object } A wrapper with a node with a 'doc-section' css class where to insert the content.
  # - excludeComponents { String or Array } componentModel.id or an array of such.
  constructor: ({ @componentTree, @renderingContainer, $wrapper, excludeComponents }) ->
    assert @componentTree, 'no componentTree specified'
    assert @renderingContainer, 'no rendering container specified'

    @$root = $(@renderingContainer.renderNode)
    @$wrapperHtml = $wrapper
    @componentViews = {}

    @excludedComponentIds = {}
    @excludeComponent(excludeComponents)
    @readySemaphore = new Semaphore()
    @renderOncePageReady()
    @readySemaphore.start()


  # @param { String or Array } componentModel.id or an array of such.
  excludeComponent: (componentId) ->
    return unless componentId?
    if $.isArray(componentId)
      for compId in componentId
        @excludeComponent(compId)
    else
      @excludedComponentIds[componentId] = true
      view = @componentViews[componentId]
      if view? and view.isAttachedToDom
        @removeComponentFromDom(view.model)


  setRoot: () ->
    if @$wrapperHtml?.length && @$wrapperHtml.jquery
      selector = ".#{ config.css.section }"
      $insert = @$wrapperHtml.find(selector).add( @$wrapperHtml.filter(selector) )
      if $insert.length
        @$wrapper = @$root
        @$wrapper.append(@$wrapperHtml)
        @$root = $insert

    # Store a reference to the componentTree in the $root node.
    # Some dom.coffee methods need it to get hold of the componentTree
    @$root.data('componentTree', @componentTree)


  renderOncePageReady: ->
    @readySemaphore.increment()
    @renderingContainer.ready =>
      @setRoot()
      @render()
      @setupComponentTreeListeners()
      @readySemaphore.decrement()


  ready: (callback) ->
    @readySemaphore.addCallback(callback)


  isReady: ->
    @readySemaphore.isReady()


  html: ->
    assert @isReady(), 'Cannot generate html. Renderer is not ready.'
    @renderingContainer.html()


  # ComponentTree Event Handling
  # ----------------------------

  setupComponentTreeListeners: ->
    @componentTree.componentAdded.add( $.proxy(@componentAdded, this) )
    @componentTree.componentRemoved.add( $.proxy(@componentRemoved, this) )
    @componentTree.componentMoved.add( $.proxy(@componentMoved, this) )
    @componentTree.componentContentChanged.add( $.proxy(@componentContentChanged, this) )
    @componentTree.componentHtmlChanged.add( $.proxy(@componentHtmlChanged, this) )


  componentAdded: (model) ->
    @insertComponent(model)


  componentRemoved: (component) ->
    component.descendantsAndSelf (model) =>
      @removeComponentFromDom(model)
      @deleteCachedComponentView(model)


  componentMoved: (model) ->
    @removeComponentFromDom(model)
    @insertComponent(model)


  componentContentChanged: (model, directiveName) ->
    @getOrCreateComponentView(model).updateContent(directiveName)


  componentHtmlChanged: (model) ->
    @getOrCreateComponentView(model).updateHtml()


  # Rendering
  # ---------

  getComponentViewById: (componentId) ->
    @componentViews[componentId]


  getOrCreateComponentView: (model) ->
    return view if view = @componentViews[model.id]

    view = model.createView(@renderingContainer.isReadOnly)
    view.setRenderer(this)
    @componentViews[model.id] = view


  deleteCachedComponentView: (model) ->
    @componentViews[model.id]?.removeRenderer()
    delete @componentViews[model.id]


  render: ->
    @componentTree.each (model) =>
      @insertComponent(model)


  clear: ->
    @componentTree.each (model) =>
      @getOrCreateComponentView(model).setAttachedToDom(false)

    @$root.empty()


  redraw: ->
    @clear()
    @render()


  insertComponent: (model) ->
    return if @isComponentAttached(model) || @excludedComponentIds[model.id] == true

    if @isComponentAttached(model.previous)
      @insertComponentAsSibling(model.previous, model)
    else if @isComponentAttached(model.next)
      @insertComponentAsSibling(model.next, model)
    else if model.parentContainer
      @appendComponentToParentContainer(model)
    else
      log.error('Component could not be inserted by renderer.')

    componentView = @getOrCreateComponentView(model)
    componentView.setAttachedToDom(true)
    @renderingContainer.componentViewWasInserted(componentView)
    @attachChildComponents(model)


  isComponentAttached: (model) ->
    model && @getComponentViewById(model.id)?.isAttachedToDom


  attachChildComponents: (model) ->
    model.children (childModel) =>
      if not @isComponentAttached(childModel)
        @insertComponent(childModel)


  insertComponentAsSibling: (sibling, model) ->
    method = if sibling == model.previous then 'after' else 'before'
    @$nodeForComponent(sibling)[method](@$nodeForComponent(model))


  appendComponentToParentContainer: (model) ->
    $node = @$nodeForComponent(model)
    $container = @$nodeForContainer(model.parentContainer)
    $container.append($node)


  $nodeForComponent: (model) ->
    @getOrCreateComponentView(model).$html


  $nodeForContainer: (container) ->
    if container.isRoot
      @$root
    else
      parentView = @getOrCreateComponentView(container.parentComponent)
      $(parentView.getDirectiveElement(container.name))


  # Remove a componentView from the DOM
  removeComponentFromDom: (model) ->
    if @isComponentAttached(model)
      view = @getComponentViewById(model.id)
      view.$html.detach()
      view.setAttachedToDom(false)

