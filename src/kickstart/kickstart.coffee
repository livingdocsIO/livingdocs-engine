assert = require('../modules/logging/assert')
log = require('../modules/logging/log')
words = require('../modules/words')

Design = require('../design/design')
SnippetTree = require('../snippet_tree/snippet_tree')

DOMParser = require('xmldom').DOMParser
XMLSerializer = require('xmldom').XMLSerializer

module.exports = class Kickstart

  constructor: ({ xmlTemplate, scriptNode, destination, design} = {}) ->
    unless this instanceof Kickstart
      return new Kickstart({ xmlTemplate, scriptNode, destination, design })

    assert scriptNode || xmlTemplate, 'Please provide parameter "xmlTemplate" or "scriptNode"'

    if scriptNode
      xmlTemplate = "<root>" + $(scriptNode).text() + "</root>"

    @template = Kickstart.parseXML(xmlTemplate)
    @design = new Design(design)
    @snippetTree = new SnippetTree()

    @addRootSnippets($(@template).children())


  # Parse XML and return the root node
  #
  # On node xmldom is required. In the browser
  # DOMParser and XMLSerializer are already native objects.
  @parseXML: (xmlTemplate) ->
    # xmlDoc = $.parseXML(xmlTemplate)
    xmlDoc = new DOMParser().parseFromString(xmlTemplate)
    xmlDoc.firstChild


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
    renderer = new Renderer
      snippetTree: @snippetTree
      renderingContainer: new RenderingContainer()

    renderer.html()

