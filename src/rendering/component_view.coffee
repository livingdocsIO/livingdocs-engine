$ = require('jquery')
config = require('../configuration/config')
css = config.css
attr = config.attr
DirectiveIterator = require('../template/directive_iterator')
eventing = require('../modules/eventing')
dom = require('../interaction/dom')

module.exports = class ComponentView

  constructor: ({ @model, @$html, @directives, @isReadOnly }) ->
    @$elem = @$html
    @template = @model.template
    @isAttachedToDom = false
    @wasAttachedToDom = $.Callbacks();

    unless @isReadOnly
      # add attributes and references to the html
      @$html
        .data('componentView', this)
        .addClass(css.component)
        .attr(attr.template, @template.identifier)

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
      @setStyle(name, value)

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
    @$html.next().data('componentView')


  prev: ->
    @$html.prev().data('componentView')


  afterFocused: () ->
    @$html.addClass(css.componentHighlight)
    @showOptionals()


  afterBlurred: () ->
    @$html.removeClass(css.componentHighlight)
    @hideEmptyOptionals()


  # @param cursor: undefined, 'start', 'end'
  focus: (cursor) ->
    first = @directives.editable?[0].elem
    $(first).focus()


  hasFocus: ->
    @$html.hasClass(css.componentHighlight)


  getBoundingClientRect: ->
    @$html[0].getBoundingClientRect()


  getAbsoluteBoundingClientRect: ->
    dom.getAbsoluteBoundingClientRect(@$html[0])


  content: (content) ->
    for name, value of content
      directive = @model.directives.get(name)
      if directive.isImage
        if directive.base64Image?
          @set(name, directive.base64Image)
        else
          @set(name, directive.getImageUrl() )
      else
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
    return if @hasFocus()

    $elem = @directives.$getElem(name)
    $elem.toggleClass(css.noPlaceholder, Boolean(value))
    $elem.attr(attr.placeholder, @template.defaults[name])

    $elem.html(value || '')


  focusEditable: (name) ->
    $elem = @directives.$getElem(name)
    $elem.addClass(css.noPlaceholder)


  blurEditable: (name) ->
    $elem = @directives.$getElem(name)
    if @model.isEmpty(name)
      $elem.removeClass(css.noPlaceholder)


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

      imageService = @model.directives.get(name).getImageService()
      imageService.set($elem, value)

      $elem.removeClass(config.css.emptyImage)
    else
      setPlaceholder = $.proxy(@setPlaceholderImage, this, $elem, name)
      @delayUntilAttached(name, setPlaceholder) # todo: replace with @afterInserted -> ... (something like $.Callbacks('once remember'))


  setPlaceholderImage: ($elem, name) ->
    $elem.addClass(config.css.emptyImage)

    value = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9InllcyI/PjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iNjI0IiBoZWlnaHQ9IjM1MSIgdmlld0JveD0iMCAwIDYyNCAzNTEiIHByZXNlcnZlQXNwZWN0UmF0aW89Im5vbmUiPjxyZWN0IHdpZHRoPSI2MjQiIGhlaWdodD0iMzUxIiBmaWxsPSIjRDRENENFIi8+PGxpbmUgeDE9IjAiIHkxPSIwIiB4Mj0iNjI0IiB5Mj0iMzUxIiBzdHlsZT0ic3Ryb2tlOiNmZmZmZmY7c3Ryb2tlLXdpZHRoOjIiLz48bGluZSB4MT0iNjI0IiB5MT0iMCIgeDI9IjAiIHkyPSIzNTEiIHN0eWxlPSJzdHJva2U6I2ZmZmZmZjtzdHJva2Utd2lkdGg6MiIvPjwvc3ZnPgo="
    imageService = @model.directives.get(name).getImageService()
    imageService.set($elem, value)


  setStyle: (name, className) ->
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
    $blocker = $("<div class='#{ css.interactionBlocker }'>")
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


  # Wait to execute a method until the view is attached to the DOM
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
