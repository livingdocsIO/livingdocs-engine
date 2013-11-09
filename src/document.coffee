# Document
# --------
# Manage the document and its dependencies.
# Initialze everyting.
#
# ### Design:
# Manage available Templates
#
# ### Assets:
# Load and manage CSS and Javascript dependencies
# of the designs
#
# ### Content:
# Initialize the SnippetTree.
#
# ### Page:
# Initialize event listeners.
# Link the SnippetTree with the DomTree.
document = do ->

  # Document object
  # ---------------

  initialized: false
  uniqueId: 0
  ready: $.Callbacks('memory once')
  changed: $.Callbacks()


  # *Public API*
  init: ({ design, json, rootNode }={}) ->
    if @initialized
      return documentReady()
    #assert not @initialized, 'document is already initialized'
    @initialized = true

    @design = new Design(design)

    @snippetTree = if json && @design
      new SnippetTree(content: json, design: @design)
    else
      new SnippetTree()

    # forward changed event
    @snippetTree.changed.add =>
      @changed.fire()

    # Page initialization
    @page = new InteractivePage(renderNode: rootNode, design: @design)

    # render document
    @renderer = new Renderer
      snippetTree: @snippetTree
      renderingContainer: @page

    @renderer.ready => @ready.fire()


  createView: (parent=window.document.body) ->
    createRendererAndResolvePromise = =>
      page = new Page
        renderNode: iframe.contentDocument.body
        hostWindow: iframe.contentWindow
        design: @design
      renderer = new Renderer
        renderingContainer: page
        snippetTree: @snippetTree
      deferred.resolve
        iframe: iframe
        renderer: renderer

    deferred = $.Deferred()
    $parent = $(parent).first()
    iframe = $parent[0].ownerDocument.createElement('iframe')
    iframe.src = 'about:blank'
    iframe.onload = createRendererAndResolvePromise
    $parent.append(iframe)

    deferred.promise()


  eachContainer: (callback) ->
    @snippetTree.eachContainer(callback)


  # *Public API*
  add: (input) ->
    if jQuery.type(input) == 'string'
      snippet = @createModel(input)
    else
      snippet = input

    @snippetTree.append(snippet) if snippet
    snippet


  # *Public API*
  createModel: (identifier) ->
    template = @getTemplate(identifier)
    template.createModel() if template


  # find all instances of a certain Template
  # e.g. search "bootstrap.hero" or just "hero"
  find: (search) ->
    @snippetTree.find(search)


  # print the SnippetTree
  printTree: () ->
    @snippetTree.print()


  toJson: ->
    json = @snippetTree.toJson()
    json['meta'] =
      title: undefined
      author: undefined
      created: undefined
      published: undefined

    json


  toHtml: ->
    new Renderer(
      snippetTree: @snippetTree
      renderingContainer: new RenderingContainer()
    ).html()


  restore: (contentJson, resetFirst = true) ->
    @reset() if resetFirst
    @snippetTree.fromJson(contentJson, @design)
    @renderer.render()


  reset: ->
    @renderer.clear()
    @snippetTree.detach()


  getTemplate: (identifier) ->
    template = @design?.get(identifier)

    assert template, "could not find template #{ identifier }"

    template

