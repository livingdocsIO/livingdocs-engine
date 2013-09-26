class SnippetView

  constructor: ({ @model, @$html, @directives }) ->
    @template = @model.template
    @attachedToDom = false
    @wasAttachedToDom = $.Callbacks();

    # add attributes and references to the html
    @$html
      .data('snippet', this)
      .addClass(docClass.snippet)
      .attr(docAttr.template, @template.identifier)

    @updateContent()
    @updateHtml()


  updateContent: ->
    @content(@model.content)


  updateHtml: ->
    for name, value of @model.styles
      @style(name, value)


  next: ->
    @$html.next().data('snippet')


  prev: ->
    @$html.prev().data('snippet')


  # @param cursor: undefined, 'start', 'end'
  focus: (cursor) ->
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
      when 'editable' then @getEditable(name)
      when 'image' then @getImage(name)


  getEditable: (name) ->
    elem = @directives.get(name).elem
    $(elem).html()


  setEditable: (name, value) ->
    elem = @directives.get(name).elem
    $(elem).html(value)


  getImage: (name) ->
    elem = @directives.get(name).elem
    $(elem).attr('src')


  setImage: (name, value) ->
    elem = @directives.get(name).elem
    $elem = $(elem)

    if value
      @cancelDelayed(name)
      @setImageAttribute($elem, value)
    else
      setPlaceholder = $.proxy(@setPlaceholderImage, this, $elem)
      @delayUntilAttached(name, setPlaceholder)


  setImageAttribute: ($elem, value) ->
    if $elem.context.tagName == 'IMG'
      $elem.attr('src', value)
    else
      $elem.attr('style', "background-image:url(#{value})")


  setPlaceholderImage: ($elem) ->
    if $elem.context.tagName == 'IMG'
      width = $elem.width()
      height = $elem.height()
    else
      width = $elem.outerWidth()
      height = $elem.outerHeight()
    value = "http://placehold.it/#{width}x#{height}/BEF56F/B2E668"
    @setImageAttribute($elem, value)


  style: (name, className) ->
    changes = @template.styles[name].cssClassChanges(className)
    if changes.remove
      for removeClass in changes.remove
        @$html.removeClass(removeClass)

    @$html.addClass(changes.add)


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


  delayUntilAttached: (name, func) ->
    if @attachedToDom
      func()
    else
      @cancelDelayed(name)
      @delayed ||= {}
      @delayed[name] = eventing.callOnce @wasAttachedToDom, =>
        @delayed[name] = undefined
        func()


  cancelDelayed: (name) ->
    if @delayed?[name]
      @wasAttachedToDom.remove(@delayed[name])
      @delayed[name] = undefined
