kickstart = do ->

  init: (destination, design) ->
    domElements = $(destination).children().not('script')
    $(destination).html('<div class="doc-section"></div>')
    doc.init(design: design)
    doc.ready =>
      #add all root snippets, set their editables
      domElements.each (index, element) =>
        row = doc.add(@nodeToSnippetName(element))
        @setChildren(row, element)


  parseContainers: (snippet, data) ->
    containers = if snippet.containers then Object.keys(snippet.containers) else []
    if containers.length == 1 && containers.indexOf('default') != -1 && !$(data).children('default').length
      for child in $(data).children()
        @parseSnippets(snippet, 'default', child)

    for editableContainer in $(containers.join(','), data)
      for child in $(editableContainer).children()
        @parseSnippets(snippet, editableContainer.localName, child)


  parseSnippets: (parentContainer, region, data) ->
    snippet = doc.create(@nodeToSnippetName(data))
    parentContainer.append(region, snippet)
    @setChildren(snippet, data)


  setChildren: (snippet, data) ->
    @parseContainers(snippet, data)
    @setEditables(snippet, data)


  setEditables: (snippet, data) ->
    for key of snippet.editables
      snippet.set(key, null)
      child = $(key, data).get()[0]

      if key == 'image' && !child
        child = $('img', data).get()[0]

      if !child
        log('The snippet "' + key + '" has no content. Display parent HTML instead.')
        child = data

      snippet.set(key, child.innerHTML)


  # Convert a dom element into a camelCase snippetName
  nodeToSnippetName: (element) ->
    snippetName = $.camelCase(element.localName)
    snippet = doc.document.design.get(snippetName)

    # check deprecated HTML elements that automatically convert to new element name.
    if snippetName == 'img' && !snippet
      snippetName = 'image'
      snippet = doc.document.design.get('image')
  
    assert snippet,
      "The Template named '#{snippetName}' does not exist."

    snippetName
