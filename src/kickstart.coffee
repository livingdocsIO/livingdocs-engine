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


  setChildren: (snippet, xmlData) ->
    @populateSnippetContainers(snippet, xmlData)
    @setEditables(snippet, xmlData)


  populateSnippetContainers: (snippet, xmlData) ->
    containers = if snippet.containers then Object.keys(snippet.containers) else []

    # add snippets to default container if no other containers exists
    hasOnlyDefault = containers.indexOf('default') != -1 && containers.length == 1
    templateNotInChildNode = !xmlData.getElementsByTagName('default').length
    if hasOnlyDefault && templateNotInChildNode
      for child in xmlData.children
        @appendSnippetToContainer(snippet, child, 'default')

    else if containers.length
      for editableContainer in xmlData.querySelectorAll(containers.join(','))
        for child in editableContainer.children
          @appendSnippetToContainer(snippet, child, @nodeNameToCamelCase(editableContainer))


  appendSnippetToContainer: (parentContainer, snippetXML, region) ->
    snippet = doc.create(@nodeToSnippetName(snippetXML))
    parentContainer.append(region, snippet)
    @setChildren(snippet, snippetXML)


  setEditables: (snippet, xmlData) ->
    for editableName of snippet.content
      value = @getValueForEditable(editableName, xmlData, snippet)
      snippet.set(editableName, value) if value


  getValueForEditable: (editableName, xmlData, snippet) ->
    child = xmlData.getElementsByTagName(words.snakeCase(editableName))?[0]
    value = @getXmlValue(child, editableName)

    if !value
      log.warn("The editable '#{editableName}' of '#{snippet.identifier}' has no content. Display parent HTML instead.")
      value = @getXmlValue(xmlData)

    value


  nodeNameToCamelCase: (element) ->
    $.camelCase(element.localName)


  # Convert a dom element into a camelCase snippetName, check
  nodeToSnippetName: (element) ->
    snippetName = @nodeNameToCamelCase(element)
    snippet = doc.getDesign().get(snippetName)

    assert snippet,
      "The Template named '#{snippetName}' does not exist."

    snippetName


  getXmlValue: (node, tagName) ->
    if !tagName
      tagName = @nodeNameToCamelCase(node)

    match = new XMLSerializer().serializeToString(node).match(new RegExp("<#{tagName}.*?>(.*?)<\\/#{tagName}>"))
    if match
      return $("<div>#{match[1]}</div>").html()
    else
      null
