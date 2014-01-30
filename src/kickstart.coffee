class Kickstart

  constructor: ({ xmlTemplate, scriptNode, destination, design} = {}) ->
    if !(this instanceof Kickstart)
      return new Kickstart({ xmlTemplate, scriptNode, destination, design })

    assert scriptNode || xmlTemplate, 'Please provide parameter "xmlTemplate" or "scriptNode"'

    if scriptNode
      xmlTemplate = "<root>" + $(scriptNode).text() + "</root>"
    
    @template = $.parseXML(xmlTemplate).firstChild
    @design = new Design(design)
    @snippetTree = new SnippetTree()

    @addRootSnippets($(@template).children())


  addRootSnippets: (xmlElements) ->
    for xmlElement, index in xmlElements
      snippetModel = @createSnippet(xmlElement)
      @setChildren(snippetModel, xmlElement)
      row = @snippetTree.append(snippetModel)


  setChildren: (snippetModel, snippetXML) ->
    @populateSnippetContainers(snippetModel, snippetXML)
    @setEditables(snippetModel, snippetXML)
    @setEditableStyles(snippetModel, snippetXML)


  populateSnippetContainers: (snippetModel, snippetXML) ->
    directives = snippetModel.template.directives
    if directives.length == 1 && directives.container
      hasOnlyOneContainer = true
      containerDirective = directives.container[0]

    # add snippets to default container if no other containers exists
    if hasOnlyOneContainer && !@descendants(snippetXML, containerDirective.name).length
      for child in @descendants(snippetXML)
        @appendSnippetToContainer(snippetModel, child, containerDirective.name)

    else
      containers = if snippetModel.containers then Object.keys(snippetModel.containers) else []
      for container in containers
        for editableContainer in @descendants(snippetXML, container)
          for child in @descendants(editableContainer)
            @appendSnippetToContainer(snippetModel, child, @nodeNameToCamelCase(editableContainer))


  appendSnippetToContainer: (snippetModel, snippetXML, region) ->
    snippet = @createSnippet(snippetXML)
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
        snippetModel.setStyle(style[0], style[1]) if style.length > 1


  # Convert a dom element into a camelCase snippetName
  nodeToSnippetName: (element) ->
    snippetName = @nodeNameToCamelCase(element)
    snippet = @design.get(snippetName)

    assert snippet,
      "The Template named '#{snippetName}' does not exist."

    snippetName


  createSnippet: (xml) ->
    @design.get(@nodeToSnippetName(xml)).createModel()


  descendants: (xml, nodeName) ->
    tagLimiter = words.snakeCase(nodeName) if nodeName
    $(xml).children(tagLimiter)


  getXmlValue: (node) ->
    if node
      string = new XMLSerializer().serializeToString(node)
      start = string.indexOf('>') + 1
      end = string.lastIndexOf('<')
      if end > start
        string.substring(start, end)

  getSnippetTree: ->
    @snippetTree

  toHtml: ->
    new Renderer(
      snippetTree: @snippetTree
      renderingContainer: new RenderingContainer()
    ).html()
