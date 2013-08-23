class SnippetView

  constructor: ({ @model, @$html, @directives, @editables, @containers, @images }) ->
    @template = @model.template
    @attachedToDom = false

    # add attributes and references to the html
    @$html
      .data('snippet', this)
      .addClass(docClass.snippet)
      .attr(docAttr.template, @template.identifier)

    @updateContent()


  updateContent: ->
    @content(@model.editables, @model.images)


  next: ->
    @$html.next().data('snippet')


  prev: ->
    @$html.prev().data('snippet')


  focus: ->
    first = @firstEditableElem()
    $(first).focus()


  firstEditableElem: ->
    for directive in @editables
      return directive.elem


  getBoundingClientRect: ->
    dom.getBoundingClientRect(@$html[0])


  content: (editables, images) ->
    for field, value of editables
      @set(field, value)

    for field, value of images
      @setImage(field, value)


  getEditable: (name) ->
    if name?
      return @directives.get(name).elem
    else if @editables.length
      return @editables[0].elem


  setImage: (name, value) ->
    elem = @directives.get(name).elem
    $(elem).attr('src', value)


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

