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
  snippets: {}
  uniqueId: 0
  ready: $.Callbacks('memory once')


  # *Public API*
  loadDocument: ({ contentJson }={}) ->
    error('document is already initialized') if @initialized
    @initialized = true

    @snippetTree = if contentJson
      new SnippetTree(content: contentJson)
    else
      new SnippetTree()

    # Page initialization
    page.initializeListeners()

    # EditableJS initialization
    editableController()

    # render document
    $root = page.getDocumentSection()
    @renderer = new Renderer(snippetTree: @snippetTree, rootNode: $root[0])
    @renderer.render()

    documentReady()


  # *Public API*
  addSnippetCollection: (snippetCollection, config) ->
    namespace = config?.namespace || 'snippet'

    # for convenience add a default namespace if there is just
    # one namespace loaded
    if @listSnippetNamespaces().length == 0
      defaultNamespace = namespace
    else
      defaultNamespace = undefined

    if config.css
      loader.css(config.css, doBeforeDocumentReady())

    @snippets[namespace] ||= {}

    for name, template of snippetCollection

      @snippets[namespace][name] = new SnippetTemplate
        namespace: namespace
        name: name
        html: template.html
        title: template.name


  listSnippetNamespaces: () ->
    for namespace of @snippets
      namespace


  # list available snippetTemplates
  listSnippets: ->
    for namespace, value of @snippets
      for name, snippet of value
        snippet.identifier



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
    if typeof search == 'string'
      res = []
      @snippetTree.each (snippet) ->
        if snippet.identifier == search || snippet.template.name == search
          res.push(snippet)

      new SnippetArray(res)
    else
      new SnippetArray()


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


  getTemplate: (identifier) ->
    identifier = @addDefaultNamespace(identifier)

    { namespace, name } = SnippetTemplate.parseIdentifier(identifier)
    snippetTemplate = @snippets[namespace]?[name]

    if !snippetTemplate
      error("could not find template #{ identifier }")

    snippetTemplate


  # if just one namespace is loaded we can prepend the default namespace
  # for convenience
  addDefaultNamespace: (identifier) ->
    if defaultNamespace && not /\./.test(identifier)
      "#{ defaultNamespace }.#{ identifier }"
    else
      identifier


