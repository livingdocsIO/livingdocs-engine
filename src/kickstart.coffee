kickstart = do ->

  init: (destination, design) ->
    domElements = $(destination).children().not('script')
    $(destination).html('<div class="doc-section"></div>')
    doc.init(design: design)
    doc.ready =>
      #add all rootSnippets, process their containers and set values
      domElements.each (index, element) =>
        row = doc.add(@domElementToSnippetName(element))
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
        @parseSnippets(snippet, @domElementToSnippetName(element), child)


  parseSnippets: (parentContainer, region, data) ->
    snippet = doc.create(@domElementToSnippetName(data))
    parentContainer.append(region, snippet)
    @setChildren(snippet, data)


  setChildren: (snippet, data) ->
    @parseContainers(snippet, data)
    @setEditables(snippet, data)


  setEditables: (snippet, data) ->
    if snippet.hasEditables()
      for key of snippet.editables
        snippet.set(key, undefined)
        child = $(key + ':first', data).get()[0]
        if !child
          snippet.set(key, data.innerHTML)
        else
          snippet.set(key, child.innerHTML)


  # Convert a dom element into a camelCase snippetName
  domElementToSnippetName: (element) ->
    if element.tagName then $.camelCase(element.tagName.toLowerCase()) else null
