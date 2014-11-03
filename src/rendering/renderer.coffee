assert = require('../modules/logging/assert')
log = require('../modules/logging/log')
Semaphore = require('../modules/semaphore')
config = require('../configuration/config')

module.exports = class Renderer

  constructor: ({ @componentTree, @renderingContainer, $wrapper }) ->
    assert @componentTree, 'no snippet tree specified'
    assert @renderingContainer, 'no rendering container specified'

    @$root = $(@renderingContainer.renderNode)
    @$wrapperHtml = $wrapper
    @snippetViews = {}

    @readySemaphore = new Semaphore()
    @renderOncePageReady()
    @readySemaphore.start()


  setRoot: () ->
    if @$wrapperHtml?.length && @$wrapperHtml.jquery
      selector = ".#{ config.css.section }"
      $insert = @$wrapperHtml.find(selector).add( @$wrapperHtml.filter(selector) )
      if $insert.length
        @$wrapper = @$root
        @$wrapper.append(@$wrapperHtml)
        @$root = $insert

    # Store a reference to the componentTree in the $root node.
    # Some dom.coffee methods need it to get hold of the snippet tree
    @$root.data('componentTree', @componentTree)


  renderOncePageReady: ->
    @readySemaphore.increment()
    @renderingContainer.ready =>
      @setRoot()
      @render()
      @setupSnippetTreeListeners()
      @readySemaphore.decrement()


  ready: (callback) ->
    @readySemaphore.addCallback(callback)


  isReady: ->
    @readySemaphore.isReady()


  html: ->
    assert @isReady(), 'Cannot generate html. Renderer is not ready.'
    @renderingContainer.html()


  # Snippet Tree Event Handling
  # ---------------------------

  setupSnippetTreeListeners: ->
    @componentTree.snippetAdded.add( $.proxy(@snippetAdded, this) )
    @componentTree.snippetRemoved.add( $.proxy(@snippetRemoved, this) )
    @componentTree.snippetMoved.add( $.proxy(@snippetMoved, this) )
    @componentTree.snippetContentChanged.add( $.proxy(@snippetContentChanged, this) )
    @componentTree.snippetHtmlChanged.add( $.proxy(@snippetHtmlChanged, this) )


  snippetAdded: (model) ->
    @insertSnippet(model)


  snippetRemoved: (model) ->
    @removeSnippet(model)
    @deleteCachedSnippetViewForSnippet(model)


  snippetMoved: (model) ->
    @removeSnippet(model)
    @insertSnippet(model)


  snippetContentChanged: (model) ->
    @snippetViewForSnippet(model).updateContent()


  snippetHtmlChanged: (model) ->
    @snippetViewForSnippet(model).updateHtml()


  # Rendering
  # ---------


  snippetViewForSnippet: (model) ->
    @snippetViews[model.id] ||= model.createView(@renderingContainer.isReadOnly)


  deleteCachedSnippetViewForSnippet: (model) ->
    delete @snippetViews[model.id]


  render: ->
    @componentTree.each (model) =>
      @insertSnippet(model)


  clear: ->
    @componentTree.each (model) =>
      @snippetViewForSnippet(model).setAttachedToDom(false)

    @$root.empty()


  redraw: ->
    @clear()
    @render()


  insertSnippet: (model) ->
    return if @isSnippetAttached(model)

    if @isSnippetAttached(model.previous)
      @insertSnippetAsSibling(model.previous, model)
    else if @isSnippetAttached(model.next)
      @insertSnippetAsSibling(model.next, model)
    else if model.parentContainer
      @appendSnippetToParentContainer(model)
    else
      log.error('Snippet could not be inserted by renderer.')

    snippetView = @snippetViewForSnippet(model)
    snippetView.setAttachedToDom(true)
    @renderingContainer.snippetViewWasInserted(snippetView)
    @attachChildSnippets(model)


  isSnippetAttached: (model) ->
    model && @snippetViewForSnippet(model).isAttachedToDom


  attachChildSnippets: (model) ->
    model.children (childModel) =>
      if not @isSnippetAttached(childModel)
        @insertSnippet(childModel)


  insertSnippetAsSibling: (sibling, model) ->
    method = if sibling == model.previous then 'after' else 'before'
    @$nodeForSnippet(sibling)[method](@$nodeForSnippet(model))


  appendSnippetToParentContainer: (model) ->
    @$nodeForSnippet(model).appendTo(@$nodeForContainer(model.parentContainer))


  $nodeForSnippet: (model) ->
    @snippetViewForSnippet(model).$html


  $nodeForContainer: (container) ->
    if container.isRoot
      @$root
    else
      parentView = @snippetViewForSnippet(container.parentSnippet)
      $(parentView.getDirectiveElement(container.name))


  removeSnippet: (model) ->
    @snippetViewForSnippet(model).setAttachedToDom(false)
    @$nodeForSnippet(model).detach()

