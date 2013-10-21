kickstart = do ->

  init: ({ xmlTemplate, scriptNode, destination, design }) ->
    if scriptNode
      xmlTemplate = $(scriptNode).text()

    assert xmlTemplate, 'Please provide parameter "xmlTemplate" or "scriptNode"'

    destinationNode = $(destination)[0]
    if not doc.document.initialized
      doc.init(design: design, rootNode: destinationNode)

    doc.ready =>
      rootSnippets = @parseDocumentTemplate(xmlTemplate)
      for snippet in rootSnippets
        doc.add(snippet)


  parseDocumentTemplate: (xmlTemplate) ->
    root = $.parseXML("<root>" + xmlTemplate + "</root>").firstChild
    @addRootSnippets($(root).children())


  addRootSnippets: (xmlElements) ->
    rootSnippets = []
    for xmlElement, index in xmlElements
      snippetModel = doc.create(@nodeToSnippetName(xmlElement))
      rootSnippets.push(snippetModel)
      @setChildren(snippetModel, xmlElement)

    rootSnippets


  setChildren: (snippetModel, snippetXML) ->
    @populateSnippetContainers(snippetModel, snippetXML)
    @setEditables(snippetModel, snippetXML)
    @setEditableStyles(snippetModel, snippetXML)


  populateSnippetContainers: (snippetModel, snippetXML) ->
    containers = if snippetModel.containers then Object.keys(snippetModel.containers) else []

    directives = snippetModel.template.directives
    if directives.length == 1 && directives.container
      hasOnlyOneContainer = true
      containerDirective = directives.container[0]

    # add snippets to default container if no other containers exists
    if hasOnlyOneContainer && !@descendants(snippetXML, containerDirective.name).length
      for child in @descendants(snippetXML)
        @appendSnippetToContainer(snippetModel, child, containerDirective.name)

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
      value = @getValueForEditable(editableName, snippetXML, snippetModel.template.directives.length)
      snippetModel.set(editableName, value) if value


  getValueForEditable: (editableName, snippetXML, directivesQuantity) ->
    child = @descendants(snippetXML, editableName)[0]
    value = @getXmlValue(child)

    if !value && directivesQuantity == 1
      log.warn("The editable '#{editableName}' of '#{@nodeToSnippetName(snippetXML)}' has no content. Display parent HTML instead.")
      value = @getXmlValue(snippetXML)

    value


  nodeNameToCamelCase: (element) ->
    words.camelize(element.nodeName)


  setEditableStyles: (snippetModel, snippetXML) ->
    styles = $(snippetXML).attr(config.kickstart.attr.styles)
    if styles
      styles = styles.split(/\s*;\s*/)
      for style in styles
        style = style.split(/\s*:\s*/)
        @setEditableStyle(snippetModel, style[0], style[1]) if style.length > 1


  setEditableStyle: (snippet, name, styleClass) ->
    snippet.setStyle(name, styleClass)


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
