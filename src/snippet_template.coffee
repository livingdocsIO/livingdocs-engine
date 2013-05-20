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

    @$template = $( @pruneHtml(html) ).wrap("<div>")
    @$wrap = @$template.parent()
    @title = title || S.humanize( @name )

    @editables = {}
    @containers = undefined

    @parseEditables()
    @parseContainers()

    @lists = @createLists()


  # create a new snippet instance from this template
  create: (content) ->
    $snippet = @createHtml()
    @content(content, $snippet)

    snippet = new Snippet(template: this, $snippet: $snippet)
    @initializeContainers(snippet)
    snippet


  createHtml: (content) ->
    $snippet = @$template.clone()
    $snippet.addClass(docClass.snippet)
    $snippet.attr(docAttr.template, @identifier) if @identifier
    $snippet


  # todo
  pruneHtml: (html) ->
    # e.g. remove ids
    html


  # output the accepted content of the snippet
  # that can be passed to create
  # e.g: { title: "Itchy and Scratchy" }
  printDoc: () ->
    doc =
      identifier: @identifier
      editables: @editables
      containers: @containers

    S.readableJson(doc)


  content: (content, $snippet) ->
    for field, value of content
      @setField(field, value, $snippet)


  setField: (field, value, $snippet) ->
    list = @lists[field]

    if list != undefined
      list.content(value)
    else
      $snippet.findIn("[#{ docAttr.editable }=#{ field }]").html(value)


  # todo!
  findInSnippet: (startNode) ->
    # todo custom finder to search for attributes inside the snippet nodes
    # but not beyond. This means do not continue the search in snippet containers


  initializeContainers: (snippet) ->

    for containerName, value of @containers
      $container = snippet.$snippet.findIn("[#{ docAttr.container }=#{ containerName }]")

      snippet.snippetTreeNode ||= new SnippetTreeNode(snippet: snippet)
      snippet.snippetTreeNode.addContainer new SnippetContainer
        $domNode: $container
        name: containerName
        parent: snippet.snippetTreeNode


  # alias to lists
  list: (listName) ->
    @lists[listName]


  parseEditables: () ->
    @$wrap.find("[#{ docAttr.editable }]")
    .addClass(docClass.editable)
    .each (index, elem) =>
      $elem = $(elem)
      editableName = $elem.attr(docAttr.editable)
      if editableName
        @editables[editableName] = "editable"
      else
        error("missing name in snippet template #{ @identifier}")


  parseContainers: () ->
    @$wrap.find("[#{ docAttr.container }]")
    .each (index, elem) =>
      $elem = $(elem)
      containerName = $elem.attr(docAttr.container)
      @addContainer(containerName, elem)


  # add a SnippetContainer to this template
  # unnamed containers will default to "default"
  addContainer: (containerName, domNode) ->
    # todo: make sure containerName follows conventions
    # (what conventions you may ask...)

    if !containerName
      containerName = "default"
      $(domNode).attr(docAttr.container, containerName)

    @containers ||= {}

    if !@containers.hasOwnProperty(containerName)
      @containers[containerName] = "container"
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


# Static functions
# ----------------

SnippetTemplate.parseIdentifier = (identifier) ->
  if identifier && (parts = identifier.split(".")).length == 2
    { namespace: parts[0], name: parts[1] }
  else
    error("could not parse snippet template identifier: #{ identifier }")
    { namespace: undefined , name: undefined }


