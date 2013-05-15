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

  constructor: ({ @name, html, @namespace, @id, version } = {}) ->
    @version = version || 1

    @$template = $(html).wrap("<div>")
    @$wrap = @$template.parent()

    @identifier = if @namespace && @id
      "#{ @namespace }.#{ @id }"
    else
      undefined

    @parseEditables()
    @lists = @createLists()


  # create a snippet instance from this template
  snippet: (content) ->
    $snippet = @$template.clone()
    $snippet.addClass(docClass.snippet)
    $snippet.attr(docAttr.template, @identifier) if @identifier

    @content(content, $snippet)

    snippetInstance = new Snippet($snippet: $snippet, template: this)
    snippetInstance


  create: (content) ->
    $node = @$template.clone()
    @content(content, $node)
    $node


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
    { namespace: parts[0], id: parts[1] }


