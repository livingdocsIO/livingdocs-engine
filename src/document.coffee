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

  # Private
  # -------

  waitingCalls = 1 # 1 -> loadDocument

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
  snippets: {}
  uniqueId: 0
  ready: $.Callbacks("memory once")


  # *Public API*
  loadDocument: ({ contentJson }={}) ->
    error("document is already initialized") if @initialized
    @initialized = true

    @snippetTree = if contentJson
      new SnippetTree()
    else
      new SnippetTree(content: contentJson)

    # Page initialization
    page.initializeSection(snippetTree: @snippetTree)
    page.initializeListeners()

    # EditableJS initialization
    editableController()

    documentReady()


  # *Public API*
  addSnippetCollection: (snippetCollection, config) ->
    namespace = config?.namespace || "snippet"

    if config.css
      loader.css(config.css, doBeforeDocumentReady())

    @snippets[namespace] ||= {}

    for name, template of snippetCollection

      @snippets[namespace][name] = new SnippetTemplate
        namespace: namespace
        name: name
        html: template.html
        title: template.name


  # list available snippetTemplates
  listSnippets: ->
    for namespace, value of @snippets
      for name, snippet of value
        snippet.identifier



  # *Public API*
  add: (input) ->
    if jQuery.type(input) == "string"
      snippet = @createSnippet(input)
    else
      snippet = input

    @snippetTree.append(snippet) if snippet
    snippet


  # *Public API*
  createSnippet: (identifier) ->
    template = @getTemplate(identifier)
    template.create() if template


  # find all instances of a certain SnippetTemplate
  find: (identifier) ->
    res = []
    @snippetTree.each (snippet) ->
      res.push(snippet) if snippet.identifier == identifier

    res


  # print documentation for a snippet template
  help: (identifier) ->
    template = @getTemplate(identifier)
    template.printDoc()


  # print the SnippetTree
  printTree: () ->
    @snippetTree.print()


  # consider: use guids so transferring snippets between documents
  # can not cause id conflicts
  nextId: (prefix = "doc") ->
    @uniqueId += 1
    "#{ prefix }-#{ @uniqueId }"


  getTemplate: (identifier) ->
    { namespace, name } = SnippetTemplate.parseIdentifier(identifier)
    snippetTemplate = @snippets[namespace]?[name]

    if !snippetTemplate
      error("could not find template #{ identifier }")

    snippetTemplate


