kickstart = do ->

  init: (template, destination, design) ->
    xmlElements = $.parseXML("<root>" + $(template).text() + "</root>").firstChild.children
    $(destination).html('<div class="doc-section"></div>')

    if not doc.document.initialized
      doc.init(design: design)
      doc.ready =>
        @addRootSnippets(xmlElements)

    else
      @addRootSnippets(xmlElements)


  addRootSnippets: (xmlElements) ->
    for xmlElement, index in xmlElements
      row = doc.add(@nodeToSnippetName(xmlElement))
      @setChildren(row, xmlElement)


  setChildren: (snippetModel, snippetXML) ->
    @populateSnippetContainers(snippetModel, snippetXML)
    @setEditables(snippetModel, snippetXML)


  populateSnippetContainers: (snippetModel, snippetXML) ->
    containers = if snippetModel.containers then Object.keys(snippetModel.containers) else []

    # add snippets to default container if no other containers exists
    hasOnlyDefault = snippetModel.template.directives.length == 1 && containers.indexOf('default') != -1
    if hasOnlyDefault && !@descendants(snippetXML, 'default').length
      for child in @descendants(snippetXML)
        @appendSnippetToContainer(snippetModel, child, 'default')

    else
      for container in containers
        for editableContainer in @descendants(snippetXML, container)
          for child in @descendants(editableContainer)
            @appendSnippetToContainer(snippetModel, child, @nodeNameToCamelCase(editableContainer))


  appendSnippetToContainer: (snippetModel, snippetXML, region) ->
    snippet = doc.create(@nodeToSnippetName(snippetXML))
    snippetModel.append(region, snippet)
    @setChildren(snippet, snippetXML)


  setEditables: (snippetModel, snippetXML) ->
    for editableName of snippetModel.content
      value = @getValueForEditable(editableName, snippetXML, snippetModel)
      snippetModel.set(editableName, value) if value


  getValueForEditable: (editableName, snippetXML, snippet) ->
    child = @descendants(snippetXML, editableName)[0]
    value = @getXmlValue(child)

    if !value
      log.warn("The editable '#{editableName}' of '#{snippet.identifier}' has no content. Display parent HTML instead.")
      value = @getXmlValue(snippetXML)

    value


  nodeNameToCamelCase: (element) ->
    words.camelize(element.nodeName)


  # Convert a dom element into a camelCase snippetName
  nodeToSnippetName: (element) ->
    snippetName = @nodeNameToCamelCase(element)
    snippet = doc.getDesign().get(snippetName)

    assert snippet,
      "The Template named '#{snippetName}' does not exist."

    snippetName


  descendants: (xml, tagName) ->
    tagLimiter = words.snakeCase(tagName) if tagName
    $(xml).children(tagLimiter)


  getXmlValue: (node) ->
    if node
      string = new XMLSerializer().serializeToString(node)
      start = string.indexOf('>') + 1
      end = string.lastIndexOf('<')
      if end > start
        string.substring(start, end)
