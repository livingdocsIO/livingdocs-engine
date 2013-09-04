class SnippetView

  constructor: ({ @model, @$html, @directives }) ->
    @template = @model.template
    @attachedToDom = false

    # add attributes and references to the html
    @$html
      .data('snippet', this)
      .addClass(docClass.snippet)
      .attr(docAttr.template, @template.identifier)

    @updateContent()


  updateContent: ->
    @content(@model.content)


  next: ->
    @$html.next().data('snippet')


  prev: ->
    @$html.prev().data('snippet')


  focus: ->
    first = @directives.editable?[0].elem
    $(first).focus()


  getBoundingClientRect: ->
    dom.getBoundingClientRect(@$html[0])


  content: (content) ->
    for name, value of content
      @set(name, value)


  set: (name, value) ->
    directive = @directives.get(name)
    switch directive.type
      when 'editable' then @setEditable(name, value)
      when 'image' then @setImage(name, value)


  get: (name) ->
    directive = @directives.get(name)
    switch directive.type
      when 'editable' then @getEditable(name, value)
      when 'image' then @getImage(name, value)


  getImage: (name) ->
    elem = @directives.get(name).elem
    $(elem).attr('src')


  setImage: (name, value) ->
    elem = @directives.get(name).elem
    $(elem).attr('src', value)


  getEditable: (name) ->
    elem = @directives.get(name).elem
    $(elem).html()


  setEditable: (name, value) ->
    elem = @directives.get(name).elem
    $(elem).html(value)


  append: (containerName, $elem) ->
    $container = $(@directives.get(containerName)?.elem)
    $container.append($elem)


  attach: (renderer) ->
    return if @attachedToDom
    previous = @model.previous
    next = @model.next
    parentContainer = @model.parentContainer

    if previous? and
      (previousHtml = renderer.getSnippetView(previous)) and
      previousHtml.attachedToDom
        previousHtml.$html.after(@$html)
        @attachedToDom = true
    else if next? and
      (nextHtml = renderer.getSnippetView(next)) and
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
      snippetView = renderer.getSnippetView(container.parentSnippet)
      snippetView.append(container.name, @$html)


  detach: ->
    @attachedToDom = false
    @$html.detach()


  get$container: ->
    $(dom.findContainer(@$html[0]).node)

