assert = require('../modules/logging/assert')
log = require('../modules/logging/log')
Semaphore = require('../modules/semaphore')
config = require('../configuration/config')

module.exports = class Renderer

  constructor: ({ @snippetTree, @renderingContainer, $wrapper }) ->
    assert @snippetTree, 'no snippet tree specified'
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

    # Store a reference to the snippetTree in the $root node.
    # Some dom.coffee methods need it to get hold of the snippet tree
    @$root.data('snippetTree', @snippetTree)


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
    @snippetTree.snippetAdded.add( $.proxy(@snippetAdded, this) )
    @snippetTree.snippetRemoved.add( $.proxy(@snippetRemoved, this) )
    @snippetTree.snippetMoved.add( $.proxy(@snippetMoved, this) )
    @snippetTree.snippetContentChanged.add( $.proxy(@snippetContentChanged, this) )
    @snippetTree.snippetHtmlChanged.add( $.proxy(@snippetHtmlChanged, this) )


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
    @snippetTree.each (model) =>
      @insertSnippet(model)


  clear: ->
    @snippetTree.each (model) =>
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

