# SnippetTemplate
# ---------------
# Parses snippet templates and creates snippet html.
#
# __Methods:__
# @snippet() create new snippets with content
#
# Consider: allow tags to be optional. These tags can then be hidden by the user.
# The template needs to know where to reinsert the tag if it is reinserted again.
# Options could be to set `display:none` or to remove the element and leave a marker
# instead (a comment or a script tag like ember does for example)

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

    @parseEditables()
    @lists = @createLists()


  # create a new snippet instance from this template
  create: (content) ->
    $snippet = @createHtml()
    @content(content, $snippet)

    snippetInstance = new Snippet(template: this, $snippet: $snippet)
    snippetInstance


  createHtml: (content) ->
    $snippet = @$template.clone()
    $snippet.addClass(docClass.snippet)
    $snippet.attr(docAttr.template, @identifier) if @identifier
    $snippet


  # todo
  pruneHtml: (html) ->
    # remove ids
    html


  # output the accepted content of the snippet
  # that can be passed to create
  # e.g: { title: "Itchy and Scratchy" }
  doc: () ->
    #todo


  content: (content, $snippet) ->
    for field, value of content
      @setField(field, value, $snippet)


  setField: (field, value, $snippet) ->
    list = @lists[field]

    if list != undefined
      list.content(value)
    else
      $snippet.findIn("[#{ docAttr.editable }=#{ field }]").html(value)


  # alias to lists
  list: (listName) ->
    @lists[listName]


  parseEditables: () ->
    @$wrap.find("[#{ docAttr.editable }]").addClass(docClass.editable)


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


