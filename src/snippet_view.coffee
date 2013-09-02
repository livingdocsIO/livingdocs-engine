class SnippetView

  constructor: ({ @model, @$html, @editables, @containers, @images }) ->
    @template = @model.template
    @attachedToDom = false
    @wasAttachedToDom = $.Callbacks();

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


  # @param cursor: undefined, 'start', 'end'
  focus: (cursor) ->
    first = @firstEditableElem()
    $(first).focus()


  firstEditableElem: ->
    for name, elem of @editables
      return elem


  getBoundingClientRect: ->
    dom.getBoundingClientRect(@$html[0])


  content: (content, images) ->
    for field, value of content
      @set(field, value)

    for field, value of images
      @setImage(field, value)


  getEditable: (name) ->
    if name?
      return @editables[name]
    else
      for name of @editables
        return @editables[name]


  setPlaceholderImage: ($elem) ->
    if $elem.context.tagName == 'IMG'
      width = $elem.width()
      height = $elem.height()
    else
      width = $elem.outerWidth()
      height = $elem.outerHeight()
    value = "http://placehold.it/#{width}x#{height}/BEF56F/B2E668"
    @setImageAttribute($elem, value)


  setImageAttribute: ($elem, value) ->
    if $elem.context.tagName == 'IMG'
      $elem.attr('src', value)
    else
      $elem.attr('style', "background-image:url(#{value})")


  setImage: (name, value) ->
    $elem = $(@images[name])
    unless value
      if @attachedToDom
        @setPlaceholderImage($elem)
      else
        @wasAttachedToDom.add($.proxy(@setPlaceholderImage, @, $elem))
    else
      @setImageAttribute($elem, value)


  set: (editable, value) ->
    if arguments.length == 1
      value = editable
      editable = undefined

    elem = @getEditable(editable)
    assert elem, 'cannot set value without editable name'
    $(elem).html(value)


  get: (editable) ->
    elem = @getEditable(editable)
    assert elem, 'cannot get value without editable name'
    $(elem).html()


  append: (containerName, $elem) ->
    $container = $(@containers[containerName])
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

    @wasAttachedToDom.fire()

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

