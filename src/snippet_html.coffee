class SnippetHtml

  constructor: ({ @snippet, @$html, @editables, @containers }) ->
    @template = @snippet.template
    @attachedToDom = false
    @snippet.snippetHtml = this

    # add attributes and references to the html
    @$html
      .data('snippet', @snippet)
      .addClass(docClass.snippet)
      .attr(docAttr.template, @template.identifier)

    @updateContent()


  updateContent: ->
    @content(@snippet.editables)


  content: (content) ->
    for field, value of content
      @set(field, value)


  getEditable: (name) ->
    if name?
      return @editables[name]
    else
      for name of @editables
        return @editables[name]


  set: (editable, value) ->
    if arguments.length == 1
      value = editable
      editable = undefined

    if elem = @getEditable(editable)
      $(elem).html(value)
    else
      log.error 'cannot set value without editable name'


  get: (editable) ->
    if elem = @getEditable(editable)
      $(elem).html()
    else
      log.error 'cannot get value without editable name'


  append: (containerName, $elem) ->
    $container = $(@containers[containerName])
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

