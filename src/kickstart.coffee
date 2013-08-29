kickstart = do ->

  init: (destination, design) ->
    domElements = $(destination).children().not('script')
    $(destination).html('<div class="doc-section"></div>')
    doc.init(design: design)
    doc.ready =>
      #add all rootSnippets, process their containers and set values
      domElements.each (index, element) =>
        row = doc.add(@nodeToSnippetName(element))
        @setChildren(row, element)

  parseContainers: (snippet, data) ->
    containers = if snippet.containers then Object.keys(snippet.containers) else []
    if containers.length == 1 && containers.indexOf('default') != -1 && !$(data).children('default').length
      children = $(data).children()
      for child in children
        @parseSnippets(snippet, 'default', child)

    elements = $(containers.join(','), data)
    for element in elements
      children = $(element).children()
      for child in children
        @parseSnippets(snippet, @nodeToSnippetName(element), child)


  parseSnippets: (parentContainer, region, data) ->
    snippetName = @nodeToSnippetName(data)
    if doc.document.design.get(snippetName)
      snippet = doc.create(snippetName)
      parentContainer.append(region, snippet)
    else
      log.error('The Template named "' + snippetName + '" does not exist.')
    @setChildren(snippet, data)


  setChildren: (snippet, data) ->
    @parseContainers(snippet, data)
    @setEditables(snippet, data)


  setEditables: (snippet, data) ->
    for key of snippet.editables
      snippet.set(key, undefined)
      child = $(key + ':first', data).get()[0]
      if !child
        snippet.set(key, data.innerHTML)
      else
        snippet.set(key, child.innerHTML)


  # Convert a dom element into a camelCase snippetName
  nodeToSnippetName: (element) ->
    $.camelCase(element.localName)
