class SnippetView

  constructor: ({ @model, @$html, @directives }) ->
  # (U+FEFF) zero width no-break space
  zeroWidthCharacter = '\ufeff'

    @template = @model.template
    @attachedToDom = false
    @wasAttachedToDom = $.Callbacks();

    # add attributes and references to the html
    @$html
      .data('snippet', this)
      .addClass(docClass.snippet)
      .attr(docAttr.template, @template.identifier)

    @render()


  render: (mode) ->
    @updateContent()
    @updateHtml()


  updateContent: ->
    @content(@model.content)

    if not @hasFocus()
      @hideEmptyOptionals()


  updateHtml: ->
    for name, value of @model.styles
      @style(name, value)


  # Show all doc-optionals whether they are empty or not.
  showOptionals: ->
    @directives.each (directive) =>
      if directive.optional
        config.animations.optionals.show($(directive.elem))


  # Hide all empty doc-optionals
  hideEmptyOptionals: ->
    @directives.each (directive) =>
      if directive.optional && @model.isEmpty(directive.name)
        config.animations.optionals.hide($(directive.elem))


  next: ->
    @$html.next().data('snippet')


  prev: ->
    @$html.prev().data('snippet')


  afterFocused: () ->
    @$html.addClass(docClass.snippetHighlight)
    @showOptionals()


  afterBlurred: () ->
    @$html.removeClass(docClass.snippetHighlight)
    @hideEmptyOptionals()


  # @param cursor: undefined, 'start', 'end'
  focus: (cursor) ->
    first = @directives.editable?[0].elem
    $(first).focus()


  hasFocus: ->
    @$html.hasClass(docClass.snippetHighlight)


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
      when 'html' then @setHtml(name, value)


  get: (name) ->
    directive = @directives.get(name)
    switch directive.type
      when 'editable' then @getEditable(name)
      when 'image' then @getImage(name)
      when 'html' then @getHtml(name)


  getEditable: (name) ->
    elem = @directives.get(name).elem
    $(elem).html()


  setEditable: (name, value) ->
    elem = @directives.get(name).elem
    if not value
      $(elem).attr(config.html.attr.placeholder, @template.defaults[name])
    else
      $(elem).attr(config.html.attr.placeholder, zeroWidthCharacter)

    $(elem).html(value)


  focusEditable: (name) ->
    elem = @directives.get(name).elem
    $(elem).attr(config.html.attr.placeholder, zeroWidthCharacter)


  blurEditable: (name) ->
    directive = @directives.get(name)
    $elem = $(directive.elem)
    if @model.isEmpty(name)
      $elem.attr(config.html.attr.placeholder, @template.defaults[name])


  getHtml: (name) ->
    elem = @directives.get(name).elem
    $(elem).html()


  setHtml: (name, value) ->
    elem = @directives.get(name).elem
    $elem = $(elem)
    $elem.html(value)
    @blockInteraction($elem)

    @directivesToReset ||= {}
    @directivesToReset[name] = name


  # Reset directives that contain arbitrary html after the view is moved in
  # the DOM to recreate iframes. In the case of twitter where the iframes
  # don't have a src the reloading that happens when one moves an iframe clears
  # all content (Maybe we could limit resetting to iframes without a src).
  #
  # Some more info about the issue on stackoverflow:
  # http://stackoverflow.com/questions/8318264/how-to-move-an-iframe-in-the-dom-without-losing-its-state
  resetDirectives: ->
    for name of @directivesToReset
      elem = @directives.get(name).elem
      if $(elem).find('iframe').length
        @set(name, @model.content[name])


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
    if $elem[0].nodeName == 'IMG'
      $elem.attr('src', value)
    else
      $elem.attr('style', "background-image:url(#{value})")


  setPlaceholderImage: ($elem) ->
    if $elem[0].nodeName == 'IMG'
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


  # Disable tabbing for the children of an element.
  # This is used for html content so it does not disrupt the user
  # experience. The timeout is used for cases like tweets where the
  # iframe is generated by a script with a delay.
  disableTabbing: ($elem) ->
    setTimeout( =>
      $elem.find('iframe').attr('tabindex', '-1')
    , 400)


  # Append a child to the element which will block user interaction
  # like click or touch events. Also try to prevent the user from getting
  # focus on a child elemnt through tabbing.
  blockInteraction: ($elem) ->
    @ensureRelativePosition($elem)
    $blocker = $("<div class='#{ docClass.interactionBlocker }'>")
      .attr('style', 'position: absolute; top: 0; bottom: 0; left: 0; right: 0;')
    $elem.append($blocker)

    @disableTabbing($elem)


  # Make sure that all absolute positioned children are positioned
  # relative to $elem.
  ensureRelativePosition: ($elem) ->
    position = $elem.css('position')
    if position != 'absolute' && position != 'fixed' && position != 'relative'
      $elem.css('position', 'relative')


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

    @resetDirectives()
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
