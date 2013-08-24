kickstart = do ->
  init: (destination, design) ->
    domElements = $(destination).children().not('script')
    $(destination).html('<div class="doc-section"></div>')
    doc.init(design: design)
    doc.ready =>

      # Convert a dom element into a camelCase snippetName
      domElementToSnippetName = (element) =>
        if element.tagName then $.camelCase(element.tagName.toLowerCase()) else null


      parseContainers = (parent, data) =>
        containers = if parent.containers then Object.keys(parent.containers) else []
        if containers.length == 1 && containers.indexOf('default') != -1 && !$(data).children('default').length
          children = $(data).children()
          for child in children
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
          for key of snippet.editables
            snippet.set(key, null)
            child = $(key + ':first', data).get()[0]
            if !child
              snippet.set(key, data.innerHTML)
            else
              snippet.set(key, child.innerHTML)


      #add all rootSnippets, process their containers and set values
      domElements.each (index, element) =>
        row = doc.add(domElementToSnippetName(element))
        parseContainers(row, element)
        setEditables(row, element)


