class SnippetHtml

  constructor: ({ @snippet, @$html, @editables, @containers }) ->
    @template = @snippet.template
    @attachedToDom = false

    # add attributes and references to the html
    @$html
      .data('snippet', this)
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


  attach: (renderer) ->
    return if @attachedToDom
    previous = @snippet.previous
    next = @snippet.next
    parentContainer = @snippet.parentContainer

    if previous? and
      (previousHtml = renderer.getSnippetHtml(previous)) and
      previousHtml.attachedToDom
        previousHtml.$html.after(@$html)
        @attachedToDom = true
    else if next? and
      (nextHtml = renderer.getSnippetHtml(next)) and
      nextHtml.attachedToDom
        nextHtml.$html.before(@$html)
        @attachedToDom = true
    else if parentContainer
      @appendToContainer(parentContainer, renderer)
      @attachedToDom = true

    this


  appendToContainer: (container, renderer) ->
    if container.isRoot
      renderer.$root.append(@$html)
    else
      snippetHtml = renderer.getSnippetHtml(container.parentSnippet)
      snippetHtml.append(container.name, @$html)


  detach: ->
    @attachedToDom = false
    @$html.detach()


  get$container: ->
    $(dom.parentContainer(@$html[0]).node)


  # old code from SnippetTemplate with list handling
  # setField: (field, value, $snippet) ->
  #   list = @lists[field]

  #   if list != undefined
  #     list.content(value)
  #   else
  #     $snippet.findIn("[#{ docAttr.editable }=#{ field }]").html(value)

