config = require('../configuration/defaults')
DirectiveIterator = require('../template/directive_iterator')
eventing = require('../modules/eventing')

module.exports = class SnippetView

  constructor: ({ @model, @$html, @directives, @isReadOnly }) ->
    @template = @model.template
    @isAttachedToDom = false
    @wasAttachedToDom = $.Callbacks();

    unless @isReadOnly
      # add attributes and references to the html
      @$html
        .data('snippet', this)
        .addClass(config.html.css['snippet'])
        .attr(config.html.attr['template'], @template.identifier)

    @render()


  render: (mode) ->
    @updateContent()
    @updateHtml()


  updateContent: ->
    @content(@model.content)

    if not @hasFocus()
      @displayOptionals()

    @stripHtmlIfReadOnly()


  updateHtml: ->
    for name, value of @model.styles
      @style(name, value)

    @stripHtmlIfReadOnly()


  displayOptionals: ->
    @directives.each (directive) =>
      if directive.optional
        $elem = $(directive.elem)
        if @model.isEmpty(directive.name)
          $elem.css('display', 'none')
        else
          $elem.css('display', '')


  # Show all doc-optionals whether they are empty or not.
  # Use on focus.
  showOptionals: ->
    @directives.each (directive) =>
      if directive.optional
        config.animations.optionals.show($(directive.elem))


  # Hide all empty doc-optionals
  # Use on blur.
  hideEmptyOptionals: ->
    @directives.each (directive) =>
      if directive.optional && @model.isEmpty(directive.name)
        config.animations.optionals.hide($(directive.elem))


  next: ->
    @$html.next().data('snippet')


  prev: ->
    @$html.prev().data('snippet')


  afterFocused: () ->
    @$html.addClass(config.html.css.snippetHighlight)
    @showOptionals()


  afterBlurred: () ->
    @$html.removeClass(config.html.css.snippetHighlight)
    @hideEmptyOptionals()


  # @param cursor: undefined, 'start', 'end'
  focus: (cursor) ->
    first = @directives.editable?[0].elem
    $(first).focus()


  hasFocus: ->
    @$html.hasClass(config.html.css.snippetHighlight)


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
    $elem = @directives.$getElem(name)
    $elem.html()


  setEditable: (name, value) ->
    $elem = @directives.$getElem(name)
    placeholder = if value
      config.zeroWidthCharacter
    else
      @template.defaults[name]

    $elem.attr(config.html.attr.placeholder, placeholder)
    $elem.html(value || '')


  focusEditable: (name) ->
    $elem = @directives.$getElem(name)
    $elem.attr(config.html.attr.placeholder, config.zeroWidthCharacter)


  blurEditable: (name) ->
    $elem = @directives.$getElem(name)
    if @model.isEmpty(name)
      $elem.attr(config.html.attr.placeholder, @template.defaults[name])


  getHtml: (name) ->
    $elem = @directives.$getElem(name)
    $elem.html()


  setHtml: (name, value) ->
    $elem = @directives.$getElem(name)
    $elem.html(value || '')

    if not value
      $elem.html(@template.defaults[name])
    else if value and not @isReadOnly
      @blockInteraction($elem)

    @directivesToReset ||= {}
    @directivesToReset[name] = name


  getDirectiveElement: (directiveName) ->
    @directives.get(directiveName)?.elem


  # Reset directives that contain arbitrary html after the view is moved in
  # the DOM to recreate iframes. In the case of twitter where the iframes
  # don't have a src the reloading that happens when one moves an iframe clears
  # all content (Maybe we could limit resetting to iframes without a src).
  #
  # Some more info about the issue on stackoverflow:
  # http://stackoverflow.com/questions/8318264/how-to-move-an-iframe-in-the-dom-without-losing-its-state
  resetDirectives: ->
    for name of @directivesToReset
      $elem = @directives.$getElem(name)
      if $elem.find('iframe').length
        @set(name, @model.content[name])


  getImage: (name) ->
    $elem = @directives.$getElem(name)
    $elem.attr('src')


  setImage: (name, value) ->
    $elem = @directives.$getElem(name)

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
    $blocker = $("<div class='#{ config.html.css.interactionBlocker }'>")
      .attr('style', 'position: absolute; top: 0; bottom: 0; left: 0; right: 0;')
    $elem.append($blocker)

    @disableTabbing($elem)


  # Make sure that all absolute positioned children are positioned
  # relative to $elem.
  ensureRelativePosition: ($elem) ->
    position = $elem.css('position')
    if position != 'absolute' && position != 'fixed' && position != 'relative'
      $elem.css('position', 'relative')


  get$container: ->
    $(dom.findContainer(@$html[0]).node)


  delayUntilAttached: (name, func) ->
    if @isAttachedToDom
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


  stripHtmlIfReadOnly: ->
    return unless @isReadOnly

    iterator = new DirectiveIterator(@$html[0])
    while elem = iterator.nextElement()
      @stripDocClasses(elem)
      @stripDocAttributes(elem)
      @stripEmptyAttributes(elem)


  stripDocClasses: (elem) ->
    $elem = $(elem)
    for klass in elem.className.split(/\s+/)
      $elem.removeClass(klass) if /doc\-.*/i.test(klass)


  stripDocAttributes: (elem) ->
    $elem = $(elem)
    for attribute in Array::slice.apply(elem.attributes)
      name = attribute.name
      $elem.removeAttr(name) if /data\-doc\-.*/i.test(name)


  stripEmptyAttributes: (elem) ->
    $elem = $(elem)
    strippableAttributes = ['style', 'class']
    for attribute in Array::slice.apply(elem.attributes)
      isStrippableAttribute = strippableAttributes.indexOf(attribute.name) >= 0
      isEmptyAttribute = attribute.value.trim() == ''
      if isStrippableAttribute and isEmptyAttribute
        $elem.removeAttr(attribute.name)


  setAttachedToDom: (newVal) ->
    return if newVal == @isAttachedToDom

    @isAttachedToDom = newVal

    if newVal
      @resetDirectives()
      @wasAttachedToDom.fire()
