# SnippetTemplate
# ---------------
# Parses snippet templates and creates snippet html.
#
# __Methods:__
# @snippet() create new snippets with content
#
# Consider: allow tags to be optional. These tags can then be hidden by
# the user. The template needs to know where to reinsert the tag if it is
# reinserted again.
# Options could be to set `display:none` or to remove the element and
# leave a marker instead.
# (a comment or a script tag like ember does for example)
#
# Consider: Replace lists with inline SnippetTemplates. Inline
# SnippetTemplates are repeatable and can only be used inside their
# defining snippet.
class SnippetTemplate


  constructor: ({ html, @namespace, @name, identifier, title, version } = {}) ->
    if identifier
      { @namespace, @name } = SnippetTemplate.parseIdentifier(identifier)

    @identifier = if @namespace && @name
      "#{ @namespace }.#{ @name }"

    @version = version || 1

    @$template = $( @pruneHtml(html) ).wrap('<div>')
    @$wrap = @$template.parent()
    @title = title || S.humanize( @name )

    @editables = undefined
    @containers = undefined

    @parseTemplate()
    @lists = @createLists()


  # create a new snippet instance from this template
  createSnippet: () ->
    new Snippet(template: this)


  createHtml: (snippet) ->
    if not snippet?
      snippet = @createSnippet()

    $html = @$template.clone()
    #fields
    #containers

    snippetHtml = new SnippetHtml
      snippet: snippet
      $html: $html


  # todo
  pruneHtml: (html) ->
    # e.g. remove ids
    html


  # @param snippetNode: root DOM node of the snippet
  parseTemplate: () ->
    snippetNode = @$template[0]
    { @editables, @containers } = @getNodeLinks(snippetNode)

    for name, node of @editables
      @formatEditable(name, node)

    for name, node of @containers
      @formatContainer(name, node)


  getNodeLinks: (snippetNode) ->
    editables = containers = undefined
    iterator = new SnippetNodeIterator(snippetNode)

    while iterator.nextElement()
      node = iterator.current

      if name = node.getAttribute(docAttr.editable)
        editables ||= {}
        name ||= config.defaultEditableName
        if editables.hasOwnProperty(name)
          error("editable name '#{ name }' already taken: #{ @identifier }")

        editables[name] = node

      else if name = node.getAttribute(docAttr.container)
        containers ||= {}
        name ||= config.defaultContainerName
        if containers.hasOwnProperty(name)
          error("container name '#{ name }' already taken: #{ @identifier }")

        containers[name] = node

    { editables, containers }


  formatEditable: (name, elem) ->
    $elem = $(elem)
    $elem.addClass(docClass.editable)

    if name == config.defaultEditableName
      $elem.attr(docAttr.editable, name)


  # add a SnippetContainer to this template
  # unnamed containers will default to "default"
  formatContainer: (name, elem) ->
    $elem = $(elem)

    if name == config.defaultContainerName
      $elem.attr(docAttr.container, name)


  createLists: () ->
    lists = {}
    @$wrap.find("[#{ docAttr.list }]").each( ->
      $list = $(this)
      listName = $list.attr("#{ docAttr.list }")
      lists[listName] = new SnippetTemplateList(listName, $list)
    )
    lists


  # alias to lists
  list: (listName) ->
    @lists[listName]


  # output the accepted content of the snippet
  # that can be passed to create
  # e.g: { title: "Itchy and Scratchy" }
  printDoc: () ->
    doc =
      identifier: @identifier
      editables: @editables
      containers: @containers

    S.readableJson(doc)


# Static functions
# ----------------

SnippetTemplate.parseIdentifier = (identifier) ->
  if identifier && (parts = identifier.split('.')).length == 2
    { namespace: parts[0], name: parts[1] }
  else
    error("could not parse snippet template identifier: #{ identifier }")
    { namespace: undefined , name: undefined }


