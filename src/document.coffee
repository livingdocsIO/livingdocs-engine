# Document
# --------
# Manage the document and its dependencies.
# Initialze everyting.
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
# Initialize event listeners.
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
  kickstart: (destination) ->
    domElements = $(destination).children().not('script')
    $(destination).html('<div class="doc-section"></div>')
    @loadDocument()
    @ready.add =>

      # Convert a dom element into a camelCase snippetName
      domElementToSnippetName = (element) =>
        #return (element.tagName)? $.camelCase(element.tagName.toLowerCase()) : null
        if element.tagName
          $.camelCase(element.tagName.toLowerCase())
        else
          null


      parseContainers = (parent, data) =>
        containers = if parent.containers then Object.keys(parent.containers) else []
        if containers.length == 1 && containers.indexOf('default') != -1 && !$(data).children('default').length
          children = $(data).children()
          for child in children
            # how to execute something without returning a value?
            parseSnippets(parent, 'default', child)

        elements = $(containers.join(','), data)
        for element in elements
          children = $(element).children()
          for child in children
            parseSnippets(parent, domElementToSnippetName(element), child)


      parseSnippets = (parentContainer, region, data) =>
        snippet = doc.create(domElementToSnippetName(data))
        parentContainer.append(region, snippet)
        parseContainers(snippet, data)
        setEditables(snippet, data)


      setEditables = (snippet, data) =>
        if snippet.hasEditables()
          #key of object?
          for key of snippet.editables
            snippet.set(key, null)
            child = $(key + ':first', data).get()[0]
            if !child
              snippet.set(key, data.innerHTML)
            else
              snippet.set(key, child.innerHTML)


      #Add all snippets in the dom to the document.
      #Process all containers and editables if available in the snippet.
      domElements.each (index, element) =>
        row = doc.add(domElementToSnippetName(element))
        parseContainers(row, element)
        setEditables(row, element)



  init: ({ design, json, rootNode }={}) ->
    log.error('document is already initialized') if @initialized
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
    @page = new Page()

    # load design assets into page
    if @design.css
      @page.loader.css(@design.css, doBeforeDocumentReady())

    # render document
    rootNode ||= @page.getDocumentSection()[0]
    @renderer = new Renderer(snippetTree: @snippetTree, rootNode: rootNode, page: @page)

    @ready.add =>
      @renderer.render()

    documentReady()


  loadDesign: (design) ->
    @design = new Design(design)


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
  # e.g. search "bootstrap.hero" or just "hero"
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


  restore: (contentJson, resetFirst = true) ->
    @reset() if resetFirst
    @snippetTree.fromJson(contentJson, @design)
    @renderer.render()


  reset: ->
    @renderer.clear()
    @snippetTree.detach()


  getTemplate: (identifier) ->
    template = @design?.get(identifier)

    if !template
      log.error("could not find template #{ identifier }")

    template

