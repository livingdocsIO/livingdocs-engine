class Renderer


  constructor: ({ @snippetTree, @renderingContainer }) ->
    assert @snippetTree, 'no snippet tree specified'
    assert @renderingContainer, 'no rendering container specified'

    @$root = $(@renderingContainer.renderNode)
    @setupSnippetTreeListeners()
    @snippetViews = {}


  html: ->
    @render()
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
    @$root.empty()

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


  isSnippetAttached: (model) ->
    model && @snippetViewForSnippet(model).isAttachedToDom


  insertSnippetAsSibling: (sibling, model) ->
    method = if sibling == model.previous then 'after' else 'before'
    snippetView = @snippetViewForSnippet(model)
    siblingSnippetView = @snippetViewForSnippet(sibling)
    siblingSnippetView.$html[method](snippetView.$html)


  appendSnippetToParentContainer: (model) ->
    parentContainer = model.parentContainer
    $snippetViewHtml = @snippetViewForSnippet(model).$html

    container = if parentContainer.isRoot
      @$root
    else
      parentSnippetView = @snippetViewForSnippet(parentContainer.parentSnippet)
      parentSnippetView.getDirectiveElement(parentContainer.name)

    $snippetViewHtml.appendTo(container)


  removeSnippet: (model) ->
    snippetView = @snippetViewForSnippet(model)
    snippetView.setAttachedToDom(false)
    snippetView.$html.detach()

