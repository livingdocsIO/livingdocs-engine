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

    @parseEditables()
    @parseContainers()

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


  # todo!
  findInSnippet: (startNode) ->
    # todo custom finder to search for attributes inside the snippet nodes
    # but not beyond. This means do not continue the search in snippet containers

    # check out: NodeIterator in rangy could work fine with some modifications


  findEditables: ($html, callback) ->
    $html.findIn("[#{ docAttr.editable }]").each (index, elem) ->
      callback(elem)


  parseEditables: () ->
    @findEditables @$template, (elem) =>
      $elem = $(elem)
      $elem.addClass(docClass.editable)
      editableName = $elem.attr(docAttr.editable)
      @addEditable(editableName, $elem)


  addEditable: (editableName, $elem) ->
    if !editableName
      editableName = config.defaultEditableName
      $elem.attr(docAttr.editable, editableName)

    @editables ||= {}
    if !@editables.hasOwnProperty(editableName)
      @editables[editableName] = undefined
    else
      error("editable name '#{ editableName }' already taken: #{ @identifier }")


  findContainers: ($html, callback) ->
    $html.findIn("[#{ docAttr.container }]").each (index, elem) ->
      callback(elem)


  parseContainers: ->
    @findContainers @$template, (elem) =>
      $elem = $(elem)
      containerName = $elem.attr(docAttr.container)
      @addContainer(containerName, $elem)


  # add a SnippetContainer to this template
  # unnamed containers will default to "default"
  addContainer: (containerName, $elem) ->
    # todo: make sure containerName follows conventions
    # (what conventions you may ask...)

    if !containerName
      containerName = config.defaultContainerName
      $elem.attr(docAttr.container, containerName)

    @containers ||= {}

    if !@containers.hasOwnProperty(containerName)
      @containers[containerName] = undefined
    else
      error("container name '#{ containerName }' already taken: #{ @identifier }")


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


