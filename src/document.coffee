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

  # Private Closure
  # ---------------

  waitingCalls = 1 # 1 -> init


  documentReady = =>
    waitingCalls -= 1
    if waitingCalls == 0
      document.ready.fire()


  doBeforeDocumentReady = () ->
    waitingCalls += 1
    return documentReady


  # Document object
  # ---------------

  initialized: false
  uniqueId: 0
  ready: $.Callbacks('memory once')
  changed: $.Callbacks()


  # *Public API*
  init: ({ design, json, rootNode }={}) ->
    assert not @initialized, 'document is already initialized'
    @initialized = true

    @loadDesign(design)

    @snippetTree = if json && @design
      new SnippetTree(content: json, design: @design)
    else
      new SnippetTree()

    # forward changed event
    @snippetTree.changed.add =>
      @changed.fire()

    # Page initialization
    @page = new InteractivePage(renderNode: rootNode)

    # load design assets into page
    if @design.css
      @page.loader.css(@design.css, doBeforeDocumentReady())

    # render document
    @renderer = new Renderer
      snippetTree: @snippetTree
      renderingContainer: @page

    @ready.add =>
      @renderer.render()

    documentReady()


  loadDesign: (design) ->
    @design = new Design(design)


  createView: (parent=window.document.body) ->
    iframe = $('<iframe>').appendTo(parent)[0]

    page = new Page
      renderNode: iframe.contentDocument.body
      hostWindow: iframe.contentWindow

    renderer = new Renderer
      renderingContainer: page
      snippetTree: @snippetTree

    renderer.render()

    iframe: iframe
    renderer: renderer


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

