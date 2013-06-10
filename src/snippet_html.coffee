class SnippetHtml

  constructor: ({ @snippet, @$html }) ->
    @template = @snippet.template
    @attachedToDom = false
    @snippet.snippetHtml = this

    # add attributes and references to the html
    @$html
      .data('snippet', @snippet)
      .addClass(docClass.snippet)
      .attr(docAttr.template, @template.identifier)


  content: () ->
    for field, value of content
      @set(field, value)


  set: (editable, value) ->
    if arguments.length == 1
      value = editable
      @$html.findIn("[#{ docAttr.editable }]").html(value)
    else
      @$html.findIn("[#{ docAttr.editable }=#{ editable }]").first().html(value)


  get: (editable) ->
    @$html.findIn("[#{ docAttr.editable }=#{ editable }]").html()


  append: (containerName, $elem) ->
    $container = @$html.findIn("[#{ docAttr.container }=#{ containerName }]").first()
    $container.append($elem)


  detach: ->
    @attachedToDom = false
    @$html.detach()


  # old code from SnippetTemplate with list handling
  # setField: (field, value, $snippet) ->
  #   list = @lists[field]

  #   if list != undefined
  #     list.content(value)
  #   else
  #     $snippet.findIn("[#{ docAttr.editable }=#{ field }]").html(value)

