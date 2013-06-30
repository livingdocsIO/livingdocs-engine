# Document
# --------
# Manage the document and its dependencies.
# Initialze everyting.
#
# ### Design:
# Manage available SnippetTemplates
#
# ### Assets:
# Load and manage CSS and Javascript dependencies
# of the designs
#
# ### Content:
# Initialize the SnippetTree.
#
# ### Page:
# Initialize event listeners.
# Link the SnippetTree with the DomTree.
document = do ->

  # Private Closure
  # ---------------

  waitingCalls = 1 # 1 -> loadDocument


  documentReady = =>
    waitingCalls -= 1
    if waitingCalls == 0
      document.ready.fire()


  doBeforeDocumentReady = () ->
    waitingCalls += 1
    return documentReady


  defaultNamespace = undefined


  # Document object
  # ---------------

  initialized: false
  designs: {}
  uniqueId: 0
  ready: $.Callbacks('memory once')
  changed: $.Callbacks()


  # *Public API*
  loadDocument: ({ json, rootNode }={}) ->
    log.error('document is already initialized') if @initialized
    @initialized = true

    design = @firstDesign()
    @snippetTree = if json && design
      new SnippetTree(content: json, design: design)
    else
      new SnippetTree()

    @snippetTree.changed.add =>
      @changed.fire()

    # Page initialization
    page.initializeListeners()

    # EditableJS initialization
    editableController.setup()

    # render document
    rootNode ||= page.getDocumentSection()[0]
    @renderer = new Renderer(snippetTree: @snippetTree, rootNode: rootNode)

    @ready.add =>
      @renderer.render()

    documentReady()


  addDesign: (snippetCollection, config) ->
    design = new Design(config)
    design.add(snippetCollection)
    @designs[design.namespace] = design

    # for convenience add a default namespace if there is just
    # one namespace loaded
    defaultNamespace = if @listDesignNamespaces().length == 0
      namespace
    else
      undefined

    # load design assets into page
    if design.css
      loader.css(design.css, doBeforeDocumentReady())


  eachContainer: (callback) ->
    @snippetTree.eachContainer(callback)


  listDesignNamespaces: ->
    for namespace of @designs
      namespace


  firstDesign: ->
    for namespace of @designs
      return @designs[namespace]


  # list available snippetTemplates
  listTemplates: ->
    templates = []
    for namespace, design of @designs
      design.each (template) ->
        templates.push(template.identifier)

    templates


  # *Public API*
  add: (input) ->
    if jQuery.type(input) == 'string'
      snippet = @createSnippet(input)
    else
      snippet = input

    @snippetTree.append(snippet) if snippet
    snippet


  # *Public API*
  createSnippet: (identifier) ->
    template = @getTemplate(identifier)
    template.createSnippet() if template


  # find all instances of a certain SnippetTemplate
  # e.g. search "bootstrap.hero" or just "hero"
  find: (search) ->
    @snippetTree.find(search)


  # print documentation for a snippet template
  help: (identifier) ->
    template = @getTemplate(identifier)
    template.printDoc()


  # print the SnippetTree
  printTree: () ->
    @snippetTree.print()


  # consider: use guids so transferring snippets between documents
  # can not cause id conflicts
  nextId: (prefix = 'doc') ->
    @uniqueId += 1
    "#{ prefix }-#{ @uniqueId }"


  toJson: ->
    json = @snippetTree.toJson()
    json['meta'] =
      title: undefined
      author: undefined
      created: undefined
      published: undefined

    json


  restore: (contentJson, resetFirst = true) ->
    @reset() if resetFirst
    @snippetTree.fromJson(contentJson, @firstDesign())
    @renderer.render()


  reset: ->
    @renderer.clear()
    @snippetTree.detach()


  getTemplate: (identifier) ->
    { namespace, name } = SnippetTemplate.parseIdentifier(identifier)
    namespace = defaultNamespace if defaultNamespace and not namespace
    snippetTemplate = @designs[namespace]?.get(name)

    if !snippetTemplate
      log.error("could not find template #{ identifier }")

    snippetTemplate

