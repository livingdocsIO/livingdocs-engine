# Template
# --------
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
# Consider: Replace lists with inline Templates. Inline
# Templates are repeatable and can only be used inside their
# defining snippet.
class Template


  constructor: ({ html, @namespace, @name, identifier, title, version } = {}) ->
    if not html
      log.error('Template: param html missing')

    if identifier
      { @namespace, @name } = Template.parseIdentifier(identifier)

    @identifier = if @namespace && @name
      "#{ @namespace }.#{ @name }"

    @version = version || 1

    @$template = $( @pruneHtml(html) ).wrap('<div>')
    @$wrap = @$template.parent()
    @title = title || S.humanize( @name )

    @editables = undefined
    @editableCount = 0
    @containers = undefined
    @containerCount = 0
    @defaults = {}

    @parseTemplate()
    @lists = @createLists()


  # create a new snippet instance from this template
  createSnippet: () ->
    new Snippet(template: this)


  createHtml: (snippet) ->
    if not snippet?
      snippet = @createSnippet()

    $html = @$template.clone()
    { editables, containers } = @getNodeLinks($html[0])

    snippetElem = new SnippetElem
      snippet: snippet
      $html: $html
      editables: editables
      containers: containers


  # todo
  pruneHtml: (html) ->
    # e.g. remove ids
    html


  # @param snippetNode: root DOM node of the snippet
  parseTemplate: () ->
    snippetNode = @$template[0]
    { @editables, @containers } = @getNodeLinks(snippetNode)

    count = 0
    for name, node of @editables
      count += 1
      @formatEditable(name, node)

    @editableCount = count

    count = 0
    for name, node of @containers
      count += 1
      @formatContainer(name, node)

    @containerCount = count


  # Find and store all DOM nodes which are editables or containers
  # in the html of a snippet or the html of a template.
  getNodeLinks: (snippetNode) ->
    editables = containers = undefined
    iterator = new SnippetNodeIterator(snippetNode)

    while iterator.nextElement()
      node = iterator.current

      if node.hasAttribute(docAttr.editable)
        name = node.getAttribute(docAttr.editable)
        name ||= config.defaultEditableName
        editables ||= {}
        if name and not editables.hasOwnProperty(name)
          editables[name] = node
        else
          log.error("editable name '#{ name }' already taken: #{ @identifier }")

      else if node.hasAttribute(docAttr.container)
        name = node.getAttribute(docAttr.container)
        name ||= config.defaultContainerName
        containers ||= {}
        if name and not containers.hasOwnProperty(name)
          containers[name] = node
        else
          log.error("container name '#{ name }' already taken: #{ @identifier }")

    { editables, containers }


  formatEditable: (name, elem) ->
    $elem = $(elem)
    $elem.addClass(docClass.editable)

    defaultValue = elem.innerHTML
    # not sure how to deal with default values in editables...
    # elem.innerHTML = ''

    if defaultValue
      @defaults[name] = defaultValue

    if name == config.defaultEditableName
      $elem.attr(docAttr.editable, name)


  formatContainer: (name, elem) ->

    # remove all content fron a container from the template
    elem.innerHTML = ''

    if name == config.defaultContainerName
      $(elem).attr(docAttr.container, name)


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

Template.parseIdentifier = (identifier) ->
  return unless identifier # silently fail on undefined or empty strings

  parts = identifier.split('.')
  if parts.length == 1
    { namespace: undefined, name: parts[0] }
  else if parts.length == 2
    { namespace: parts[0], name: parts[1] }
  else
    log.error("could not parse snippet template identifier: #{ identifier }")
    { namespace: undefined , name: undefined }


