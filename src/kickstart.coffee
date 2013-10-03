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


  populateSnippetContainers: (snippet, xmlData) ->
    containers = if snippet.containers then Object.keys(snippet.containers) else []
    if containers.length == 1 && containers.indexOf('default') != -1 && !xmlData.getElementsByTagName('default').length
      for child in xmlData.children
        @appendSnippetToContainer(snippet, child, 'default')

    for editableContainer in $(containers.join(','), xmlData)
      for child in editableContainer.children
        @appendSnippetToContainer(snippet, child, editableContainer.localName)


  appendSnippetToContainer: (parentContainer, data, region) ->
    snippetName = @nodeToSnippetName(data)
    snippet = doc.create(snippetName)
    parentContainer.append(region, snippet)


    @setChildren(snippet, data)


  setChildren: (snippet, xmlData) ->
    @populateSnippetContainers(snippet, xmlData)
    @setEditables(snippet, xmlData)
    window.data = xmlData


  getValueForEditable: (editableName, xmlData, snippet) ->
    child = xmlData.getElementsByTagName(editableName)?[0]
    match = new XMLSerializer().serializeToString(child).match(new RegExp("<#{editableName}.*?>(.*?)<\\/#{editableName}>"))

    if match
      value = $("<div>#{match[1]}</div>").html()
    else
      if !snippet
        snippet = { identifier: "the current kickstart" }
      log.warn("The editable '#{editableName}' of '#{snippet.identifier }' has no content. Display parent HTML instead.")
      value = xmlData.firstChild

    value


  setEditables: (snippet, xmlData) ->
    for editableName of snippet.content
      snippet.set(editableName, null)
      child = @getValueForEditable(editableName, xmlData, snippet)
      snippet.set(editableName, child)


  # Convert a dom element into a camelCase snippetName
  nodeToSnippetName: (element) ->
    snippetName = $.camelCase(element.localName)
    snippet = doc.getDesign().get(snippetName)

    # check deprecated HTML elements that automatically convert to new element name.
    if snippetName == 'img' && !snippet
      snippetName = 'image'
      snippet = doc.document.design.get('image')

    assert snippet,
      "The Template named '#{snippetName}' does not exist."

    snippetName
