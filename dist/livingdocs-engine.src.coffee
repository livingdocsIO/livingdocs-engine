# Configuration
# -------------

do ->

  @config = {
    wordSeparators: "./\\()\"':,.;<>~!#%^&*|+=[]{}`~?"

    # string containng only a <br> followed by whitespaces
    singleLineBreak: /^<br\s*\/?>\s*$/

    # (U+FEFF) zero width no-break space
    zeroWidthCharacter: '\ufeff'

    attributePrefix: 'data'

    # Here you find everything that can end up in the html
    # the engine spits out or works with.
    html:

      # css classes injected by the engine
      css:
        # document classes
        section: 'doc-section'

        # snippet classes
        snippet: 'doc-snippet'
        editable: 'doc-editable'
        interface: 'doc-ui'

        # highlight classes
        snippetHighlight: 'doc-snippet-highlight'
        containerHighlight: 'doc-container-highlight'

        # drag & drop
        draggedPlaceholder: 'doc-dragged-placeholder'
        dragged: 'doc-dragged'
        beforeDrop: 'doc-before-drop'
        afterDrop: 'doc-after-drop'

        # utility classes
        preventSelection: 'doc-no-selection'
        maximizedContainer: 'doc-js-maximized-container'
        interactionBlocker: 'doc-interaction-blocker'

      # attributes injected by the engine
      attr:
        template: 'data-doc-template'
        placeholder: 'data-doc-placeholder'


    # kickstart config
    kickstart:
      attr:
        styles: 'doc-styles'

    # Directive definitions
    #
    # attr: attribute used in templates to define the directive
    # renderedAttr: attribute used in output html
    # elementDirective: directive that takes control over the element
    #   (there can only be one per element)
    # defaultName: default name if none was specified in the template
    directives:
      container:
        attr: 'doc-container'
        renderedAttr: 'calculated later'
        elementDirective: true
        defaultName: 'default'
      editable:
        attr: 'doc-editable'
        renderedAttr: 'calculated later'
        elementDirective: true
        defaultName: 'default'
      image:
        attr: 'doc-image'
        renderedAttr: 'calculated later'
        elementDirective: true
        defaultName: 'image'
      html:
        attr: 'doc-html'
        renderedAttr: 'calculated later'
        elementDirective: true
        defaultName: 'default'
      optional:
        attr: 'doc-optional'
        renderedAttr: 'calculated later'
        elementDirective: false


    animations:
      optionals:
        show: ($elem) ->
          $elem.slideDown(250)

        hide: ($elem) ->
          $elem.slideUp(250)


    editable:
      insertSnippet: 'text'

  }

  # Shorthands for stuff that is used all over the place to make
  # code and specs more readable.
  @docClass = config.html.css
  @docAttr = config.html.attr
  @docDirective = {}
  @templateAttrLookup = {}

  for name, value of config.directives

    # Create the renderedAttrs for the directives
    # (prepend directive attributes with the configured prefix)
    prefix = "#{ config.attributePrefix }-" if @config.attributePrefix
    value.renderedAttr = "#{ prefix || '' }#{ value.attr }"


    @docDirective[name] = value.renderedAttr
    @templateAttrLookup[value.attr] = name



# Function to assert a condition. If the condition is not met, an error is
# raised with the specified message.
#
# @example
#
#   assert a isnt b, 'a can not be b'
#
assert = (condition, message) ->
  log.error(message) unless condition

# Helper method to create chainable proxies.
#
# Returns a method that works the same as $.proxy() but always returns the chainedObj
# *its mostly the same code as $.proxy ;)*
chainableProxy = (chainedObj) ->

  (fn, context) ->
    if typeof context == 'string'
      tmp = fn[ context ]
      context = fn
      fn = tmp

    # Simulated bind
    args = Array.prototype.slice.call( arguments, 2 )
    proxy = ->
      fn.apply( context || this, args.concat( Array.prototype.slice.call( arguments ) ) )
      chainedObj

    proxy

eventing = do ->

  # Add an event listener to a $.Callbacks object that will
  # remove itself from its $.Callbacks after the first call.
  callOnce: (callbacks, listener) ->
    selfRemovingFunc = (args...) ->
      callbacks.remove(selfRemovingFunc)
      listener.apply(this, args)

    callbacks.add(selfRemovingFunc)
    selfRemovingFunc

guid = do ->

  idCounter = lastId = undefined

  # Generate a unique id.
  # Guarantees a unique id in this runtime.
  # Across runtimes its likely but not guaranteed to be unique
  # Use the user prefix to almost guarantee uniqueness,
  # assuming the same user cannot generate snippets in
  # multiple runtimes at the same time (and that clocks are in sync)
  next: (user = 'doc') ->

    # generate 9-digit timestamp
    nextId = Date.now().toString(32)

    # add counter if multiple trees need ids in the same millisecond
    if lastId == nextId
      idCounter += 1
    else
      idCounter = 0
      lastId = nextId

    "#{ user }-#{ nextId }#{ idCounter }"

htmlCompare = do ->

  empty: /^\s*$/
  whitespace: /\s+/g
  normalizeWhitespace: true


  compare: (a, b) ->

    # prepare parameters
    a = $(a) if typeof a == 'string'
    b = $(b) if typeof b == 'string'

    a = a[0] if a.jquery
    b = b[0] if b.jquery

    # start comparing
    nextInA = @iterateComparables(a)
    nextInB = @iterateComparables(b)

    equivalent = true
    while equivalent
      equivalent = @compareNode( a = nextInA(), b = nextInB() )

    if not a? and not b? then true else false


  # compare two nodes
  # Returns true if they are equivalent.
  # It returns false if either a or b is undefined.
  compareNode: (a, b) ->
    if a? and b?
      if a.nodeType == b.nodeType
        switch a.nodeType
          when 1 then @compareElement(a, b)
          when 3 then @compareText(a, b)
          else log.error "HtmlCompare: nodeType #{ a.nodeType } not supported"


  compareElement: (a, b) ->
    if @compareTag(a, b)
      if @compareAttributes(a, b)
        true


  compareText: (a, b) ->
    if @normalizeWhitespace
      valA = $.trim(a.textContent).replace(@whitespace, ' ')
      valB = $.trim(b.textContent).replace(@whitespace, ' ')
      valA == valB
    else
      a.nodeValue == b.nodeValue


  compareTag: (a, b) ->
    @getTag(a) == @getTag(b)


  getTag: (node) ->
    node.namespaceURI + ':' + node.localName


  compareAttributes: (a, b) ->
    @compareAttributesWithOther(a, b) &&
    @compareAttributesWithOther(b, a)


  compareAttributesWithOther: (a, b) ->
    for aAttr in a.attributes
      bValue = b.getAttribute(aAttr.name)
      return false if not @compareAttributeValue(aAttr.name, aAttr.value, bValue)

      if  @isEmptyAttributeValue(aAttr.value) &&
          @emptyAttributeCounts(aAttr.name)
        return false if not b.hasAttribute(aAttr.name)

    return true


  emptyAttributeCounts: (attrName) ->
    switch attrName
      when 'class', 'style'
        return false
      else
        return true


  compareAttributeValue: (attrName, aValue, bValue) ->
    return true if  @isEmptyAttributeValue(aValue) &&
                    @isEmptyAttributeValue(bValue)

    return false if @isEmptyAttributeValue(aValue) ||
                    @isEmptyAttributeValue(bValue)

    switch attrName
      when 'class'
        aSorted = aValue.split(' ').sort()
        bSorted = bValue.split(' ').sort()
        aSorted.join(' ') == bSorted.join(' ')
      when 'style'
        aCleaned = @prepareStyleValue(aValue)
        bCleaned = @prepareStyleValue(bValue)
        aCleaned == bCleaned
      else
        aValue == bValue


  # consider undefined, null and '' as empty
  isEmptyAttributeValue: (val) ->
    not val? || val == ''


  prepareStyleValue: (val) ->
    val = $.trim(val)
      .replace(/\s*:\s*/g, ':') # ignore whitespaces around colons
      .replace(/\s*;\s*/g, ';') # ignore whitespaces around semi-colons
      .replace(/;$/g, '') # remove the last semicolon
    val.split(';').sort().join(';')


  isEmptyTextNode: (textNode) ->
    @empty.test(textNode.nodeValue) # consider: would .textContent be better?


  # true if element node or non-empty text node
  isComparable: (node) ->
    nodeType = node.nodeType
    true if nodeType == 1 ||
      ( nodeType == 3 && not @isEmptyTextNode(node) )


  # only iterate over element nodes and non-empty text nodes
  iterateComparables: (root) ->
    iterate = @iterate(root)
    return =>
      while next = iterate()
        return next if @isComparable(next)


  # iterate html nodes
  iterate: (root) ->
    current = next = root

    return ->
      n = current = next
      child = next = undefined
      if current
        if child = n.firstChild
          next = child
        else
          while (n != root) && !(next = n.nextSibling)
            n = n.parentNode

      current

# Fetch the outerHTML of an Element
# ---------------------------------
# @version 1.0.0
# @date February 01, 2011
# @package jquery-sparkle {@link http://www.balupton/projects/jquery-sparkle}
# @author Benjamin Arthur Lupton {@link http://balupton.com}
# @copyright 2011 Benjamin Arthur Lupton {@link http://balupton.com}
# @license MIT License {@link http://creativecommons.org/licenses/MIT/}
# @return {String} outerHtml
jQuery.fn.outerHtml = jQuery.fn.outerHtml || ->
  el = this[0]
  if el
    if (typeof el.outerHTML != 'undefined')
      return el.outerHTML

    try
      # Gecko-based browsers, Safari, Opera.
      (new XMLSerializer()).serializeToString(el)
    catch error
      try
        # Internet Explorer.
        el.xml
      catch error2
        # do nothing


# Switch one class with another
# If the class to be replaced is not present, the class to be added is added anyway
jQuery.fn.replaceClass = (classToBeRemoved, classToBeAdded) ->
  this.removeClass(classToBeRemoved)
  this.addClass(classToBeAdded)


# Include the current node in find
#
# `$("div").findIn(".willBeIncluded")` will include the div as well as the p tag
# in the results:
# ```html
# <div class="willBeIncluded">
#   <p class="willBeIncluded"></p>
# </div>
# ```
jQuery.fn.findIn = (selector) ->
  this.find(selector).add( this.filter(selector) )

jsonHelper = do ->

  isEmpty: (obj) ->
    return true unless obj?
    for name of obj
      return false if obj.hasOwnProperty(name)

    true


  flatCopy: (obj) ->
    copy = undefined

    for name, value of obj
      copy ||= {}
      copy[name] = value

    copy

# LimitedLocalstore is a wrapper around localstore that
# saves only a limited number of entries and discards
# the oldest ones after that.
#
# You should only ever create one instance by `key`.
# The limit can change between sessions,
# it will just discard all entries until the limit is met
class LimitedLocalstore

  constructor: (@key, @limit) ->
    @limit ||= 10
    @index = undefined


  push: (obj) ->
    reference =
      key: @nextKey()
      date: Date.now()

    index = @getIndex()
    index.push(reference)

    while index.length > @limit
      removeRef = index[0]
      index.splice(0, 1)
      localstore.remove(removeRef.key)

    localstore.set(reference.key, obj)
    localstore.set("#{ @key }--index", index)


  pop: ->
    index = @getIndex()
    if index && index.length
      reference = index.pop()
      value = localstore.get(reference.key)
      localstore.remove(reference.key)
      @setIndex()
      value
    else
      undefined


  get: (num) ->
    index = @getIndex()
    if index && index.length
      num ||= index.length - 1
      reference = index[num]
      value = localstore.get(reference.key)
    else
      undefined


  clear: ->
    index = @getIndex()
    while reference = index.pop()
      localstore.remove(reference.key)

    @setIndex()


  getIndex: ->
    @index ||= localstore.get("#{ @key }--index") || []
    @index


  setIndex: ->
    if @index
      localstore.set("#{ @key }--index", @index)


  nextKey: ->
    # just a random key
    addendum = Math.floor(Math.random() * 1e16).toString(32)
    "#{ @key }-#{ addendum }"







# Access to localstorage
# ----------------------
# Simplified version of [https://github.com/marcuswestin/store.js]()
localstore = ( (win) ->

  available = undefined
  storageName = 'localStorage'
  storage = win[storageName]


  set: (key, value) ->
    return @remove(key) unless value?
    storage.setItem(key, @serialize(value))
    value


  get: (key) ->
    @deserialize(storage.getItem(key))


  remove: (key) ->
    storage.removeItem(key)


  clear: ->
    storage.clear()


  isSupported: ->
    return available if available?
    available = @detectLocalstore()


  # Internal
  # --------

  serialize: (value) ->
    JSON.stringify(value)


  deserialize: (value) ->
    return undefined if typeof value != 'string'
    try
      JSON.parse(value)
    catch error
      value || undefined


  detectLocalstore: ->
    return false unless win[storageName]?
    testKey = '__localstore-feature-detection__'
    try
      @set(testKey, testKey)
      retrievedValue = @get(testKey)
      @remove(testKey)
      retrievedValue == testKey
    catch error
      false


)(this)


# Log Helper
# ----------
# Default logging helper
# @params: pass `"trace"` as last parameter to output the call stack
log = (args...) ->
  if window.console?
    if args.length and args[args.length - 1] == 'trace'
      args.pop()
      window.console.trace() if window.console.trace?

    window.console.log.apply(window.console, args)
    undefined


do ->

  # Custom error type for livingdocs.
  # We can use this to track the origin of an expection in unit tests.
  class LivingdocsError extends Error

    constructor: (message) ->
      super
      @message = message
      @thrownByLivingdocs = true


  # @param level: one of these strings:
  # 'critical', 'error', 'warning', 'info', 'debug'
  notify = (message, level = 'error') ->
    if _rollbar?
      _rollbar.push new Error(message), ->
        if (level == 'critical' or level == 'error') and window.console?.error?
          window.console.error.call(window.console, message)
        else
          log.call(undefined, message)
    else
      if (level == 'critical' or level == 'error')
        throw new LivingdocsError(message)
      else
        log.call(undefined, message)

    undefined


  log.debug = (message) ->
    notify(message, 'debug') unless log.debugDisabled


  log.warn = (message) ->
    notify(message, 'warning') unless log.warningsDisabled


  # Log error and throw exception
  log.error = (message) ->
    notify(message, 'error')


# Mixin utility
# -------------
# Allow classes to extend from multiple mixins via `extends`.
# Currently this is a simplified version of the [mixin pattern](http://coffeescriptcookbook.com/chapters/classes_and_objects/mixins)
#
# __Usage:__
# `class Superhero extends mixins Flying, SuperAngry, Indestructible`
mixins = (mixins...) ->

  # create an empty function
  Mixed = ->

  # add all objects of the mixins to the prototype of Mixed
  for mixin in mixins by -1 #earlier mixins override later ones
    for name, method of mixin
      Mixed::[name] = method

  Mixed

# This class can be used to wait for tasks to finish before firing a series of
# callbacks. Once start() is called, the callbacks fire as soon as the count
# reaches 0. Thus, you should increment the count before starting it. When
# adding a callback after having fired causes the callback to be called right
# away. Incrementing the count after it fired results in an error.
#
# @example
#
#   semaphore = new Semaphore()
#
#   semaphore.increment()
#   doSomething().then(semaphore.decrement())
#
#   doAnotherThingThatTakesACallback(semaphore.wait())
#
#   semaphore.start()
#
#   semaphore.addCallback(-> print('hello'))
#
#   # Once count reaches 0 callback is executed:
#   # => 'hello'
#
#   # Assuming that semaphore was already fired:
#   semaphore.addCallback(-> print('this will print immediately'))
#   # => 'this will print immediately'
class Semaphore

  constructor: ->
    @count = 0
    @started = false
    @wasFired = false
    @callbacks = []


  addCallback: (callback) ->
    if @wasFired
      callback()
    else
      @callbacks.push(callback)


  isReady: ->
    @wasFired


  start: ->
    assert not @started,
      "Unable to start Semaphore once started."
    @started = true
    @fireIfReady()


  increment: ->
    assert not @wasFired,
      "Unable to increment count once Semaphore is fired."
    @count += 1


  decrement: ->
    assert @count > 0,
      "Unable to decrement count resulting in negative count."
    @count -= 1
    @fireIfReady()


  wait: ->
    @increment()
    => @decrement()


  # @private
  fireIfReady: ->
    if @count == 0 && @started == true
      @wasFired = true
      callback() for callback in @callbacks

stash = do ->
  initialized = false


  init: ->
    if not initialized
      initialized = true

      # store up to ten versions
      @store = new LimitedLocalstore('stash', 10)


  snapshot: ->
    @store.push(document.toJson())


  stash: ->
    @snapshot()
    document.reset()


  delete: ->
    @store.pop()


  get: ->
    @store.get()


  restore: ->
    json = @store.get()

    assert json, 'stash is empty'
    document.restore(json)


  list: ->
    entries = for obj in @store.getIndex()
      { key: obj.key, date: new Date(obj.date).toString() }

    words.readableJson(entries)

# String Helpers
# --------------
# inspired by [https://github.com/epeli/underscore.string]()
@words = do ->


  # convert 'camelCase' to 'Camel Case'
  humanize: (str) ->
    uncamelized = $.trim(str).replace(/([a-z\d])([A-Z]+)/g, '$1 $2').toLowerCase()
    @titleize( uncamelized )


  # convert the first letter to uppercase
  capitalize : (str) ->
      str = if !str? then '' else String(str)
      return str.charAt(0).toUpperCase() + str.slice(1);


  # convert the first letter of every word to uppercase
  titleize: (str) ->
    if !str?
      ''
    else
      String(str).replace /(?:^|\s)\S/g, (c) ->
        c.toUpperCase()


  # convert 'camelCase' to 'camel-case'
  snakeCase: (str) ->
    $.trim(str).replace(/([A-Z])/g, '-$1').replace(/[-_\s]+/g, '-').toLowerCase()


  # prepend a prefix to a string if it is not already present
  prefix: (prefix, string) ->
    if string.indexOf(prefix) == 0
      string
    else
      "" + prefix + string


  # JSON.stringify with readability in mind
  # @param object: javascript object
  readableJson: (obj) ->
    JSON.stringify(obj, null, 2) # "\t"

  camelize: (str) ->
    $.trim(str).replace(/[-_\s]+(.)?/g, (match, c) ->
      c.toUpperCase()
    )

  trim: (str) ->
    str.replace(/^\s+|\s+$/g, '')


  # camelize: (str) ->
  #   $.trim(str).replace(/[-_\s]+(.)?/g, (match, c) ->
  #     c.toUpperCase()

  # classify: (str) ->
  #   $.titleize(String(str).replace(/[\W_]/g, ' ')).replace(/\s/g, '')




# A RenderingContainer is used by the Renderer to generate HTML.
#
# The Renderer inserts SnippetViews into the RenderingContainer and notifies it
# of the insertion.
#
# The RenderingContainer is intended for generating HTML. Page is a subclass of
# this base class that is intended for displaying to the user. InteractivePage
# is a subclass of Page which adds interactivity, and thus editability, to the
# page.
class RenderingContainer

  isReadOnly: true


  constructor: ->
    @renderNode = $('<div/>')[0]
    @readySemaphore = new Semaphore()
    @beforeReady()
    @readySemaphore.start()


  html: ->
    $(@renderNode).html()


  snippetViewWasInserted: (snippetView) ->


  # This is called before the semaphore is started to give subclasses a chance
  # to increment the semaphore so it does not fire immediately.
  beforeReady: ->


  ready: (callback) ->
    @readySemaphore.addCallback(callback)

# A Page is a subclass of RenderingContainer which is intended to be shown to
# the user. It has a Loader which allows you to inject CSS and JS files into the
# page.
class Page extends RenderingContainer

  constructor: ({ renderNode, readOnly, hostWindow, @design }={}) ->
    @isReadOnly = readOnly if readOnly?
    @setWindow(hostWindow)

    super()

    renderNode = renderNode || $(".#{ docClass.section }", @$body)
    if renderNode.jquery
      @renderNode = renderNode[0]
    else
      @renderNode = renderNode


  beforeReady: ->
    @cssLoader = new CssLoader(@window)
    @cssLoader.load(@design.css, @readySemaphore.wait()) if @design?.css


  setWindow: (hostWindow) ->
    @window = hostWindow || window
    @document = @window.document
    @$document = $(@document)
    @$body = $(@document.body)

# An InteractivePage is a subclass of Page which allows for manipulation of the
# rendered SnippetTree.
class InteractivePage extends Page

  LEFT_MOUSE_BUTTON = 1

  isReadOnly: false


  constructor: ({ renderNode, hostWindow }={}) ->
    super

    @focus = new Focus()
    @editableController = new EditableController(this)

    # events
    @imageClick = $.Callbacks() # (snippetView, fieldName, event) ->
    @htmlElementClick = $.Callbacks() # (snippetView, fieldName, event) ->
    @snippetWillBeDragged = $.Callbacks() # (snippetModel) ->
    @snippetWasDropped = $.Callbacks() # (snippetModel) ->

    @snippetDragDrop = new DragDrop
      longpressDelay: 400
      longpressDistanceLimit: 10
      preventDefault: false

    @focus.snippetFocus.add( $.proxy(@afterSnippetFocused, this) )
    @focus.snippetBlur.add( $.proxy(@afterSnippetBlurred, this) )

    @$document
      .on('click.livingdocs', $.proxy(@click, this))
      .on('mousedown.livingdocs', $.proxy(@mousedown, this))
      .on('touchstart.livingdocs', $.proxy(@mousedown, this))
      .on('dragstart', $.proxy(@browserDragStart, this))


  # prevent the browser Drag&Drop from interfering
  browserDragStart: (event) ->
    event.preventDefault()
    event.stopPropagation()


  removeListeners: ->
    @$document.off('.livingdocs')
    @$document.off('.livingdocs-drag')


  mousedown: (event) ->
    return if event.which != LEFT_MOUSE_BUTTON && event.type == 'mousedown' # only respond to left mouse button
    snippetView = dom.findSnippetView(event.target)

    if snippetView
      @startDrag
        snippetView: snippetView
        dragDrop: @snippetDragDrop
        event: event


  # These events are initialized immediately to allow a long-press finish
  registerDragStopEvents: (dragDrop, event) ->
    eventNames =
      if event.type == 'touchstart'
        'touchend.livingdocs-drag touchcancel.livingdocs-drag touchleave.livingdocs-drag'
      else
        'mouseup.livingdocs-drag'
    @$document.on eventNames, =>
      dragDrop.drop()
      @$document.off('.livingdocs-drag')


  # These events are possibly initialized with a delay in snippetDrag#onStart
  registerDragMoveEvents: (dragDrop, event) ->
    if event.type == 'touchstart'
      @$document.on 'touchmove.livingdocs-drag', (event) ->
        event.preventDefault()
        dragDrop.move(event.originalEvent.changedTouches[0].pageX, event.originalEvent.changedTouches[0].pageY, event)

    else # all other input devices behave like a mouse
      @$document.on 'mousemove.livingdocs-drag', (event) ->
        dragDrop.move(event.pageX, event.pageY, event)


  startDrag: ({ snippet, snippetView, dragDrop, event }) ->
    return unless snippet || snippetView
    snippet = snippetView.model if snippetView

    @registerDragMoveEvents(dragDrop, event)
    @registerDragStopEvents(dragDrop, event)
    snippetDrag = new SnippetDrag({ snippet: snippet, page: this })

    $snippet = snippetView.$html if snippetView
    dragDrop.mousedown $snippet, event,
      onDragStart: snippetDrag.onStart
      onDrag: snippetDrag.onDrag
      onDrop: snippetDrag.onDrop


  click: (event) ->
    snippetView = dom.findSnippetView(event.target)
    nodeContext = dom.findNodeContext(event.target)

    # todo: if a user clicked on a margin of a snippet it should
    # still get selected. (if a snippet is found by parentSnippet
    # and that snippet has no children we do not need to search)

    # if snippet hasChildren, make sure we didn't want to select
    # a child

    # if no snippet was selected check if the user was not clicking
    # on a margin of a snippet

    # todo: check if the click was meant for a snippet container
    if snippetView
      @focus.snippetFocused(snippetView)

      if nodeContext
        switch nodeContext.contextAttr
          when config.directives.image.renderedAttr
            @imageClick.fire(snippetView, nodeContext.attrName, event)
          when config.directives.html.renderedAttr
            @htmlElementClick.fire(snippetView, nodeContext.attrName, event)
    else
      @focus.blur()


  getFocusedElement: ->
    window.document.activeElement


  blurFocusedElement: ->
    @focus.setFocus(undefined)
    focusedElement = @getFocusedElement()
    $(focusedElement).blur() if focusedElement


  snippetViewWasInserted: (snippetView) ->
    @initializeEditables(snippetView)


  initializeEditables: (snippetView) ->
    if snippetView.directives.editable
      editableNodes = for directive in snippetView.directives.editable
        directive.elem

      @editableController.add(editableNodes)


  afterSnippetFocused: (snippetView) ->
    snippetView.afterFocused()


  afterSnippetBlurred: (snippetView) ->
    snippetView.afterBlurred()

# jQuery like results when searching for snippets.
# `doc("hero")` will return a SnippetArray that works similar to a jQuery object.
# For extensibility via plugins we expose the prototype of SnippetArray via `doc.fn`.
class SnippetArray


  # @param snippets: array of snippets
  constructor: (@snippets) ->
    @snippets = [] unless @snippets?
    @createPseudoArray()


  createPseudoArray: () ->
    for result, index in @snippets
      @[index] = result

    @length = @snippets.length
    if @snippets.length
      @first = @[0]
      @last = @[@snippets.length - 1]


  each: (callback) ->
    for snippet in @snippets
      callback(snippet)

    this


  remove: () ->
    @each (snippet) ->
      snippet.remove()

    this

# SnippetContainer
# ----------------
# A SnippetContainer contains and manages a linked list
# of snippets.
#
# The snippetContainer is responsible for keeping its snippetTree
# informed about changes (only if they are attached to one).
#
# @prop first: first snippet in the container
# @prop last: last snippet in the container
# @prop parentSnippet: parent SnippetModel
class SnippetContainer


  constructor: ({ @parentSnippet, @name, isRoot }) ->
    @isRoot = isRoot?
    @first = @last = undefined


  prepend: (snippet) ->
    if @first
      @insertBefore(@first, snippet)
    else
      @attachSnippet(snippet)

    this


  append: (snippet) ->
    if @parentSnippet
      assert snippet isnt @parentSnippet, 'cannot append snippet to itself'

    if @last
      @insertAfter(@last, snippet)
    else
      @attachSnippet(snippet)

    this


  insertBefore: (snippet, insertedSnippet) ->
    return if snippet.previous == insertedSnippet
    assert snippet isnt insertedSnippet, 'cannot insert snippet before itself'

    position =
      previous: snippet.previous
      next: snippet
      parentContainer: snippet.parentContainer

    @attachSnippet(insertedSnippet, position)


  insertAfter: (snippet, insertedSnippet) ->
    return if snippet.next == insertedSnippet
    assert snippet isnt insertedSnippet, 'cannot insert snippet after itself'

    position =
      previous: snippet
      next: snippet.next
      parentContainer: snippet.parentContainer

    @attachSnippet(insertedSnippet, position)


  up: (snippet) ->
    if snippet.previous?
      @insertBefore(snippet.previous, snippet)


  down: (snippet) ->
    if snippet.next?
      @insertAfter(snippet.next, snippet)


  getSnippetTree: ->
    @snippetTree || @parentSnippet?.snippetTree


  # Traverse all snippets
  each: (callback) ->
    snippet = @first
    while (snippet)
      snippet.descendantsAndSelf(callback)
      snippet = snippet.next


  eachContainer: (callback) ->
    callback(this)
    @each (snippet) ->
      for name, snippetContainer of snippet.containers
        callback(snippetContainer)


  # Traverse all snippets and containers
  all: (callback) ->
    callback(this)
    @each (snippet) ->
      callback(snippet)
      for name, snippetContainer of snippet.containers
        callback(snippetContainer)


  remove: (snippet) ->
    snippet.destroy()
    @_detachSnippet(snippet)


  ui: ->
    if not @uiInjector
      snippetTree = @getSnippetTree()
      snippetTree.renderer.createInterfaceInjector(this)
    @uiInjector


  # Private
  # -------

  # Every snippet added or moved most come through here.
  # Notifies the snippetTree if the parent snippet is
  # attached to one.
  # @api private
  attachSnippet: (snippet, position = {}) ->
    func = =>
      @link(snippet, position)

    if snippetTree = @getSnippetTree()
      snippetTree.attachingSnippet(snippet, func)
    else
      func()


  # Every snippet that is removed must come through here.
  # Notifies the snippetTree if the parent snippet is
  # attached to one.
  # Snippets that are moved inside a snippetTree should not
  # call _detachSnippet since we don't want to fire
  # SnippetRemoved events on the snippet tree, in these
  # cases unlink can be used
  # @api private
  _detachSnippet: (snippet) ->
    func = =>
      @unlink(snippet)

    if snippetTree = @getSnippetTree()
      snippetTree.detachingSnippet(snippet, func)
    else
      func()


  # @api private
  link: (snippet, position) ->
    @unlink(snippet) if snippet.parentContainer

    position.parentContainer ||= this
    @setSnippetPosition(snippet, position)


  # @api private
  unlink: (snippet) ->
    container = snippet.parentContainer
    if container

      # update parentContainer links
      container.first = snippet.next unless snippet.previous?
      container.last = snippet.previous unless snippet.next?

      # update previous and next nodes
      snippet.next?.previous = snippet.previous
      snippet.previous?.next = snippet.next

      @setSnippetPosition(snippet, {})


  # @api private
  setSnippetPosition: (snippet, { parentContainer, previous, next }) ->
    snippet.parentContainer = parentContainer
    snippet.previous = previous
    snippet.next = next

    if parentContainer
      previous.next = snippet if previous
      next.previous = snippet if next
      parentContainer.first = snippet unless snippet.previous?
      parentContainer.last = snippet unless snippet.next?



# SnippetModel
# ------------
# Each SnippetModel has a template which allows to generate a snippetView
# from a snippetModel
#
# Represents a node in a SnippetTree.
# Every SnippetModel can have a parent (SnippetContainer),
# siblings (other snippets) and multiple containers (SnippetContainers).
#
# The containers are the parents of the child SnippetModels.
# E.g. a grid row would have as many containers as it has
# columns
#
# # @prop parentContainer: parent SnippetContainer
class SnippetModel

  constructor: ({ @template, id } = {}) ->
    assert @template, 'cannot instantiate snippet without template reference'

    @initializeDirectives()
    @styles = {}
    @id = id || guid.next()
    @identifier = @template.identifier

    @next = undefined # set by SnippetContainer
    @previous = undefined # set by SnippetContainer
    @snippetTree = undefined # set by SnippetTree


  initializeDirectives: ->
    for directive in @template.directives
      switch directive.type
        when 'container'
          @containers ||= {}
          @containers[directive.name] = new SnippetContainer
            name: directive.name
            parentSnippet: this
        when 'editable', 'image', 'html'
          @content ||= {}
          @content[directive.name] = undefined
        else
          log.error "Template directive type '#{ directive.type }' not implemented in SnippetModel"


  createView: (isReadOnly) ->
    @template.createView(this, isReadOnly)


  hasContainers: ->
    @template.directives.count('container') > 0


  hasEditables: ->
    @template.directives.count('editable') > 0


  hasHtml: ->
    @template.directives.count('html') > 0


  hasImages: ->
    @template.directives.count('image') > 0


  before: (snippetModel) ->
    if snippetModel
      @parentContainer.insertBefore(this, snippetModel)
      this
    else
      @previous


  after: (snippetModel) ->
    if snippetModel
      @parentContainer.insertAfter(this, snippetModel)
      this
    else
      @next


  append: (containerName, snippetModel) ->
    if arguments.length == 1
      snippetModel = containerName
      containerName = config.directives.container.defaultName

    @containers[containerName].append(snippetModel)
    this


  prepend: (containerName, snippetModel) ->
    if arguments.length == 1
      snippetModel = containerName
      containerName = config.directives.container.defaultName

    @containers[containerName].prepend(snippetModel)
    this


  set: (name, value) ->
    assert @content?.hasOwnProperty(name),
      "set error: #{ @identifier } has no content named #{ name }"

    if @content[name] != value
      @content[name] = value
      @snippetTree.contentChanging(this, name) if @snippetTree


  get: (name) ->
    assert @content?.hasOwnProperty(name),
      "get error: #{ @identifier } has no content named #{ name }"

    @content[name]


  isEmpty: (name) ->
    value = @get(name)
    value == undefined || value == ''


  style: (name, value) ->
    if arguments.length == 1
      @styles[name]
    else
      @setStyle(name, value)


  setStyle: (name, value) ->
    style = @template.styles[name]
    if not style
      log.warn "Unknown style '#{ name }' in SnippetModel #{ @identifier }"
    else if not style.validateValue(value)
      log.warn "Invalid value '#{ value }' for style '#{ name }' in SnippetModel #{ @identifier }"
    else
      if @styles[name] != value
        @styles[name] = value
        if @snippetTree
          @snippetTree.htmlChanging(this, 'style', { name, value })


  copy: ->
    log.warn("SnippetModel#copy() is not implemented yet.")

    # serializing/deserializing should work but needs to get some tests first
    # json = @toJson()
    # json.id = guid.next()
    # SnippetModel.fromJson(json)


  copyWithoutContent: ->
    @template.createModel()


  # move up (previous)
  up: ->
    @parentContainer.up(this)
    this


  # move down (next)
  down: ->
    @parentContainer.down(this)
    this


  # remove TreeNode from its container and SnippetTree
  remove: ->
    @parentContainer.remove(this)


  # @api private
  destroy: ->
    # todo: move into to renderer

    # remove user interface elements
    @uiInjector.remove() if @uiInjector


  getParent: ->
     @parentContainer?.parentSnippet


  ui: ->
    if not @uiInjector
      @snippetTree.renderer.createInterfaceInjector(this)
    @uiInjector


  # Iterators
  # ---------

  parents: (callback) ->
    snippetModel = this
    while (snippetModel = snippetModel.getParent())
      callback(snippetModel)


  children: (callback) ->
    for name, snippetContainer of @containers
      snippetModel = snippetContainer.first
      while (snippetModel)
        callback(snippetModel)
        snippetModel = snippetModel.next


  descendants: (callback) ->
    for name, snippetContainer of @containers
      snippetModel = snippetContainer.first
      while (snippetModel)
        callback(snippetModel)
        snippetModel.descendants(callback)
        snippetModel = snippetModel.next


  descendantsAndSelf: (callback) ->
    callback(this)
    @descendants(callback)


  # return all descendant containers (including those of this snippetModel)
  descendantContainers: (callback) ->
    @descendantsAndSelf (snippetModel) ->
      for name, snippetContainer of snippetModel.containers
        callback(snippetContainer)


  # return all descendant containers and snippets
  allDescendants: (callback) ->
    @descendantsAndSelf (snippetModel) =>
      callback(snippetModel) if snippetModel != this
      for name, snippetContainer of snippetModel.containers
        callback(snippetContainer)


  childrenAndSelf: (callback) ->
    callback(this)
    @children(callback)


  # Serialization
  # -------------

  toJson: ->

    json =
      id: @id
      identifier: @identifier

    unless jsonHelper.isEmpty(@content)
      json.content = jsonHelper.flatCopy(@content)

    unless jsonHelper.isEmpty(@styles)
      json.styles = jsonHelper.flatCopy(@styles)

    # create an array for every container
    for name of @containers
      json.containers ||= {}
      json.containers[name] = []

    json


SnippetModel.fromJson = (json, design) ->
  template = design.get(json.identifier)

  assert template,
    "error while deserializing snippet: unknown template identifier '#{ json.identifier }'"

  model = new SnippetModel({ template, id: json.id })

  for name, value of json.content
    assert model.content.hasOwnProperty(name),
      "error while deserializing snippet: unknown content '#{ name }'"
    model.content[name] = value

  for styleName, value of json.styles
    model.style(styleName, value)

  for containerName, snippetArray of json.containers
    assert model.containers.hasOwnProperty(containerName),
      "error while deserializing snippet: unknown container #{ containerName }"

    if snippetArray
      assert $.isArray(snippetArray),
        "error while deserializing snippet: container is not array #{ containerName }"
      for child in snippetArray
        model.append( containerName, SnippetModel.fromJson(child, design) )

  model

# SnippetTree
# -----------
# Livingdocs equivalent to the DOM tree.
# A snippet tree containes all the snippets of a page in hierarchical order.
#
# The root of the SnippetTree is a SnippetContainer. A SnippetContainer
# contains a list of snippets.
#
# snippets can have multible SnippetContainers themselves.
#
# ### Example:
#     - SnippetContainer (root)
#       - Snippet 'Hero'
#       - Snippet '2 Columns'
#         - SnippetContainer 'main'
#           - Snippet 'Title'
#         - SnippetContainer 'sidebar'
#           - Snippet 'Info-Box''
#
# ### Events:
# The first set of SnippetTree Events are concerned with layout changes like
# adding, removing or moving snippets.
#
# Consider: Have a documentFragment as the rootNode if no rootNode is given
# maybe this would help simplify some code (since snippets are always
# attached to the DOM).
class SnippetTree


  constructor: ({ content, design } = {}) ->
    @root = new SnippetContainer(isRoot: true)

    # initialize content before we set the snippet tree to the root
    # otherwise all the events will be triggered while building the tree
    if content? and design?
      @fromJson(content, design)

    @root.snippetTree = this
    @initializeEvents()


  # insert snippet at the beginning
  prepend: (snippet) ->
    @root.prepend(snippet)
    this


  # insert snippet at the end
  append: (snippet) ->
    @root.append(snippet)
    this


  initializeEvents: () ->

    # layout changes
    @snippetAdded = $.Callbacks()
    @snippetRemoved = $.Callbacks()
    @snippetMoved = $.Callbacks()

    # content changes
    @snippetContentChanged = $.Callbacks()
    @snippetHtmlChanged = $.Callbacks()
    @snippetSettingsChanged = $.Callbacks()

    @changed = $.Callbacks()


  # Traverse the whole snippet tree.
  each: (callback) ->
    @root.each(callback)


  eachContainer: (callback) ->
    @root.eachContainer(callback)


  # Traverse all containers and snippets
  all: (callback) ->
    @root.all(callback)


  find: (search) ->
    if typeof search == 'string'
      res = []
      @each (snippet) ->
        if snippet.identifier == search || snippet.template.id == search
          res.push(snippet)

      new SnippetArray(res)
    else
      new SnippetArray()


  detach: ->
    @root.snippetTree = undefined
    @each (snippet) ->
      snippet.snippetTree = undefined

    oldRoot = @root
    @root = new SnippetContainer(isRoot: true)

    oldRoot


  # eachWithParents: (snippet, parents) ->
  #   parents ||= []

  #   # traverse
  #   parents = parents.push(snippet)
  #   for name, snippetContainer of snippet.containers
  #     snippet = snippetContainer.first

  #     while (snippet)
  #       @eachWithParents(snippet, parents)
  #       snippet = snippet.next

  #   parents.splice(-1)


  # returns a readable string representation of the whole tree
  print: () ->
    output = 'SnippetTree\n-----------\n'

    addLine = (text, indentation = 0) ->
      output += "#{ Array(indentation + 1).join(" ") }#{ text }\n"

    walker = (snippet, indentation = 0) ->
      template = snippet.template
      addLine("- #{ template.title } (#{ template.identifier })", indentation)

      # traverse children
      for name, snippetContainer of snippet.containers
        addLine("#{ name }:", indentation + 2)
        walker(snippetContainer.first, indentation + 4) if snippetContainer.first

      # traverse siblings
      walker(snippet.next, indentation) if snippet.next

    walker(@root.first) if @root.first
    return output


  # Tree Change Events
  # ------------------
  # Raise events for Add, Remove and Move of snippets
  # These functions should only be called by snippetContainers

  attachingSnippet: (snippet, attachSnippetFunc) ->
    if snippet.snippetTree == this
      # move snippet
      attachSnippetFunc()
      @fireEvent('snippetMoved', snippet)
    else
      if snippet.snippetTree?
        # remove from other snippet tree
        snippet.snippetContainer.detachSnippet(snippet)

      snippet.descendantsAndSelf (descendant) =>
        descendant.snippetTree = this

      attachSnippetFunc()
      @fireEvent('snippetAdded', snippet)


  fireEvent: (event, args...) ->
    this[event].fire.apply(event, args)
    @changed.fire()


  detachingSnippet: (snippet, detachSnippetFunc) ->
    assert snippet.snippetTree is this,
      'cannot remove snippet from another SnippetTree'

    snippet.descendantsAndSelf (descendants) ->
      descendants.snippetTree = undefined

    detachSnippetFunc()
    @fireEvent('snippetRemoved', snippet)


  contentChanging: (snippet) ->
    @fireEvent('snippetContentChanged', snippet)


  htmlChanging: (snippet) ->
    @fireEvent('snippetHtmlChanged', snippet)


  # Serialization
  # -------------

  printJson: ->
    words.readableJson(@toJson())


  # returns a JSON representation of the whole tree
  toJson: ->
    json = {}
    json['content'] = []

    snippetToJson = (snippet, level, containerArray) ->
      snippetJson = snippet.toJson()
      containerArray.push snippetJson

      snippetJson

    walker = (snippet, level, jsonObj) ->
      snippetJson = snippetToJson(snippet, level, jsonObj)

      # traverse children
      for name, snippetContainer of snippet.containers
        containerArray = snippetJson.containers[snippetContainer.name] = []
        walker(snippetContainer.first, level + 1, containerArray) if snippetContainer.first

      # traverse siblings
      walker(snippet.next, level, jsonObj) if snippet.next

    walker(@root.first, 0, json['content']) if @root.first

    json


  fromJson: (json, design) ->
    @root.snippetTree = undefined
    if json.content
      for snippetJson in json.content
        snippet = SnippetModel.fromJson(snippetJson, design)
        @root.append(snippet)

    @root.snippetTree = this
    @root.each (snippet) =>
      snippet.snippetTree = this




class Directive

  constructor: ({ name, @type, @elem }) ->
    @name = name || config.directives[@type].defaultName
    @config = config.directives[@type]
    @optional = false


  renderedAttr: ->
    @config.renderedAttr


  isElementDirective: ->
    @config.elementDirective


  # For every new SnippetView the directives are cloned from the
  # template and linked with the elements from the new view
  clone: ->
    newDirective = new Directive(name: @name, type: @type)
    newDirective.optional = @optional
    newDirective

# A list of all directives of a template
# Every node with an doc- attribute will be stored by its type
class DirectiveCollection

  constructor: (@all={}) ->
    @length = 0


  add: (directive) ->
    @assertNameNotUsed(directive)

    # create pseudo array
    this[@length] = directive
    directive.index = @length
    @length += 1

    # index by name
    @all[directive.name] = directive

    # index by type
    # directive.type is one of those 'container', 'editable', 'image', 'html'
    this[directive.type] ||= []
    this[directive.type].push(directive)


  next: (name) ->
    directive = name if name instanceof Directive
    directive ||= @all[name]
    this[directive.index += 1]


  nextOfType: (name) ->
    directive = name if name instanceof Directive
    directive ||= @all[name]

    requiredType = directive.type
    while directive = @next(directive)
      return directive if directive.type is requiredType


  get: (name) ->
    @all[name]


  # helper to directly get element wrapped in a jQuery object
  $getElem: (name) ->
    $(@all[name].elem)


  count: (type) ->
    if type
      this[type]?.length
    else
      @length


  each: (callback) ->
    for directive in this
      callback(directive)


  clone: ->
    newCollection = new DirectiveCollection()
    @each (directive) ->
      newCollection.add(directive.clone())

    newCollection


  assertAllLinked: ->
    @each (directive) ->
      return false if not directive.elem

    return true


  # @api private
  assertNameNotUsed: (directive) ->
    assert directive && not @all[directive.name],
      """
      #{directive.type} Template parsing error:
      #{ config.directives[directive.type].renderedAttr }="#{ directive.name }".
      "#{ directive.name }" is a duplicate name.
      """

directiveCompiler = do ->

  attributePrefix = /^(x-|data-)/

  parse: (elem) ->
    elemDirective = undefined
    modifications = []
    @parseDirectives elem, (directive) ->
      if directive.isElementDirective()
        elemDirective = directive
      else
        modifications.push(directive)

    @applyModifications(elemDirective, modifications) if elemDirective
    return elemDirective


  parseDirectives: (elem, func) ->
    directiveData = []
    for attr in elem.attributes
      attributeName = attr.name
      normalizedName = attributeName.replace(attributePrefix, '')
      if type = templateAttrLookup[normalizedName]
        directiveData.push
          attributeName: attributeName
          directive: new Directive
            name: attr.value
            type: type
            elem: elem

    # Since we modify the attributes we have to split
    # this into two loops
    for data in directiveData
      directive = data.directive
      @rewriteAttribute(directive, data.attributeName)
      func(directive)


  applyModifications: (mainDirective, modifications) ->
    for directive in modifications
      switch directive.type
        when 'optional'
          mainDirective.optional = true


  # Normalize or remove the attribute
  # depending on the directive type.
  rewriteAttribute: (directive, attributeName) ->
    if directive.isElementDirective()
      if attributeName != directive.renderedAttr()
        @normalizeAttribute(directive, attributeName)
      else if not directive.name
        @normalizeAttribute(directive)
    else
      @removeAttribute(directive, attributeName)


  # force attribute style as specified in config
  # e.g. attribute 'doc-container' becomes 'data-doc-container'
  normalizeAttribute: (directive, attributeName) ->
    elem = directive.elem
    if attributeName
      @removeAttribute(directive, attributeName)
    elem.setAttribute(directive.renderedAttr(), directive.name)


  removeAttribute: (directive, attributeName) ->
    directive.elem.removeAttribute(attributeName)


directiveFinder = do ->

  attributePrefix = /^(x-|data-)/

  link: (elem, directiveCollection) ->
    for attr in elem.attributes
      normalizedName = attr.name.replace(attributePrefix, '')
      if type = templateAttrLookup[normalizedName]
        directive = directiveCollection.get(attr.value)
        directive.elem = elem

    undefined

# Directive Iterator
# ---------------------
# Code is ported from rangy NodeIterator and adapted for snippet templates
# so it does not traverse into containers.
#
# Use to traverse all nodes of a template. The iterator does not go into
# containers and is safe to use even if there is content in these containers.
class DirectiveIterator

  constructor: (root) ->
    @root = @_next = root
    @containerAttr = config.directives.container.renderedAttr


  current: null


  hasNext: ->
    !!@_next


  next: () ->
    n = @current = @_next
    child = next = undefined
    if @current
      child = n.firstChild
      if child && n.nodeType == 1 && !n.hasAttribute(@containerAttr)
        @_next = child
      else
        next = null
        while (n != @root) && !(next = n.nextSibling)
          n = n.parentNode

        @_next = next

    @current


  # only iterate over element nodes (Node.ELEMENT_NODE == 1)
  nextElement: () ->
    while @next()
      break if @current.nodeType == 1

    @current


  detach: () ->
    @current = @_next = @root = null


# Template
# --------
# Parses snippet templates and creates SnippetModels and SnippetViews.
class Template


  constructor: ({ html, @namespace, @id, identifier, title, styles, weight } = {}) ->
    assert html, 'Template: param html missing'

    if identifier
      { @namespace, @id } = Template.parseIdentifier(identifier)

    @identifier = if @namespace && @id
      "#{ @namespace }.#{ @id }"

    @$template = $( @pruneHtml(html) ).wrap('<div>')
    @$wrap = @$template.parent()

    @title = title || words.humanize( @id )
    @styles = styles || {}
    @weight = weight
    @defaults = {}

    @parseTemplate()


  # create a new SnippetModel instance from this template
  createModel: () ->
    new SnippetModel(template: this)


  createView: (snippetModel, isReadOnly) ->
    snippetModel ||= @createModel()
    $elem = @$template.clone()
    directives = @linkDirectives($elem[0])

    snippetView = new SnippetView
      model: snippetModel
      $html: $elem
      directives: directives
      isReadOnly: isReadOnly


  pruneHtml: (html) ->

    # remove all comments
    html = $(html).filter (index) ->
      @nodeType !=8

    # only allow one root element
    assert html.length == 1, "Templates must contain one root element. The Template \"#{@identifier}\" contains #{ html.length }"

    html

  parseTemplate: () ->
    elem = @$template[0]
    @directives = @compileDirectives(elem)

    @directives.each (directive) =>
      switch directive.type
        when 'editable'
          @formatEditable(directive.name, directive.elem)
        when 'container'
          @formatContainer(directive.name, directive.elem)
        when 'html'
          @formatHtml(directive.name, directive.elem)


  # In the html of the template find and store all DOM nodes
  # which are directives (e.g. editables or containers).
  compileDirectives: (elem) ->
    iterator = new DirectiveIterator(elem)
    directives = new DirectiveCollection()

    while elem = iterator.nextElement()
      directive = directiveCompiler.parse(elem)
      directives.add(directive) if directive

    directives


  # For every new SnippetView the directives are cloned
  # and linked with the elements from the new view.
  linkDirectives: (elem) ->
    iterator = new DirectiveIterator(elem)
    snippetDirectives = @directives.clone()

    while elem = iterator.nextElement()
      directiveFinder.link(elem, snippetDirectives)

    snippetDirectives


  formatEditable: (name, elem) ->
    $elem = $(elem)
    $elem.addClass(docClass.editable)

    defaultValue = words.trim(elem.innerHTML)
    @defaults[name] = defaultValue if defaultValue
    elem.innerHTML = ''


  formatContainer: (name, elem) ->
    # remove all content fron a container from the template
    elem.innerHTML = ''


  formatHtml: (name, elem) ->
    defaultValue = words.trim(elem.innerHTML)
    @defaults[name] = defaultValue if defaultValue
    elem.innerHTML = ''


  # output the accepted content of the snippet
  # that can be passed to create
  # e.g: { title: "Itchy and Scratchy" }
  printDoc: () ->
    doc =
      identifier: @identifier
      # editables: Object.keys @editables if @editables
      # containers: Object.keys @containers if @containers

    words.readableJson(doc)


# Static functions
# ----------------

Template.parseIdentifier = (identifier) ->
  return unless identifier # silently fail on undefined or empty strings

  parts = identifier.split('.')
  if parts.length == 1
    { namespace: undefined, id: parts[0] }
  else if parts.length == 2
    { namespace: parts[0], id: parts[1] }
  else
    log.error("could not parse snippet template identifier: #{ identifier }")

class CssLoader

  constructor: (@window) ->
    @loadedUrls = []


  load: (urls, callback=$.noop) ->
    urls = [urls] unless $.isArray(urls)
    semaphore = new Semaphore()
    semaphore.addCallback(callback)
    @loadSingleUrl(url, semaphore.wait()) for url in urls
    semaphore.start()


  # @private
  loadSingleUrl: (url, callback=$.noop) ->
    if @isUrlLoaded(url)
      callback()
    else
      link = $('<link rel="stylesheet" type="text/css" />')[0]
      link.onload = callback
      link.href = url
      @window.document.head.appendChild(link)
      @markUrlAsLoaded(url)


  # @private
  isUrlLoaded: (url) ->
    @loadedUrls.indexOf(url) >= 0


  # @private
  markUrlAsLoaded: (url) ->
    @loadedUrls.push(url)

class Design

  constructor: (design) ->
    templates = design.templates || design.snippets
    config = design.config
    groups = design.config.groups || design.groups

    @namespace = config?.namespace || 'livingdocs-templates'
    @css = config.css
    @js = config.js
    @fonts = config.fonts
    @templates = []
    @groups = {}
    @styles = {}

    @storeTemplateDefinitions(templates)
    @globalStyles = @createDesignStyleCollection(design.config.styles)
    @addGroups(groups)
    @addTemplatesNotInGroups()


  storeTemplateDefinitions: (templates) ->
    @templateDefinitions = {}
    for template in templates
      @templateDefinitions[template.id] = template


  # pass the template as object
  # e.g add({id: "title", name:"Title", html: "<h1 doc-editable>Title</h1>"})
  add: (templateDefinition, styles) ->
    @templateDefinitions[templateDefinition.id] = undefined
    templateOnlyStyles = @createDesignStyleCollection(templateDefinition.styles)
    templateStyles = $.extend({}, styles, templateOnlyStyles)

    template = new Template
      namespace: @namespace
      id: templateDefinition.id
      title: templateDefinition.title
      styles: templateStyles
      html: templateDefinition.html
      weight: templateDefinition.sortOrder || 0

    @templates.push(template)
    template


  addGroups: (collection) ->
    for groupName, group of collection
      groupOnlyStyles = @createDesignStyleCollection(group.styles)
      groupStyles = $.extend({}, @globalStyles, groupOnlyStyles)

      templates = {}
      for templateId in group.templates
        templateDefinition = @templateDefinitions[templateId]
        if templateDefinition
          template = @add(templateDefinition, groupStyles)
          templates[template.id] = template
        else
          log.warn("The template '#{templateId}' referenced in the group '#{groupName}' does not exist.")

      @addGroup(groupName, group, templates)


  addTemplatesNotInGroups: (globalStyles) ->
    for templateId, templateDefinition of @templateDefinitions
      if templateDefinition
        @add(templateDefinition, @globalStyles)


  addGroup: (name, group, templates) ->
    @groups[name] =
      title: group.title
      templates: templates


  createDesignStyleCollection: (styles) ->
    designStyles = {}
    if styles
      for styleDefinition in styles
        designStyle = @createDesignStyle(styleDefinition)
        designStyles[designStyle.name] = designStyle if designStyle

    designStyles


  createDesignStyle: (styleDefinition) ->
    if styleDefinition && styleDefinition.name
      new DesignStyle
        name: styleDefinition.name
        type: styleDefinition.type
        options: styleDefinition.options
        value: styleDefinition.value


  remove: (identifier) ->
    @checkNamespace identifier, (id) =>
      @templates.splice(@getIndex(id), 1)


  get: (identifier) ->
    @checkNamespace identifier, (id) =>
      template = undefined
      @each (t, index) ->
        if t.id == id
          template = t

      template


  getIndex: (identifier) ->
    @checkNamespace identifier, (id) =>
      index = undefined
      @each (t, i) ->
        if t.id == id
          index = i

      index


  checkNamespace: (identifier, callback) ->
    { namespace, id } = Template.parseIdentifier(identifier)

    assert not namespace or @namespace is namespace,
      "design #{ @namespace }: cannot get template with different namespace #{ namespace } "

    callback(id)


  each: (callback) ->
    for template, index in @templates
      callback(template, index)


  # list available Templates
  list: ->
    templates = []
    @each (template) ->
      templates.push(template.identifier)

    templates


  # print documentation for a template
  info: (identifier) ->
    template = @get(identifier)
    template.printDoc()

class DesignStyle

  constructor: ({ @name, @type, value, options }) ->
    switch @type
      when 'option'
        assert value, "TemplateStyle error: no 'value' provided"
        @value = value
      when 'select'
        assert options, "TemplateStyle error: no 'options' provided"
        @options = options
      else
        log.error "TemplateStyle error: unknown type '#{ @type }'"


  # Get instructions which css classes to add and remove.
  # We do not control the class attribute of a snippet DOM element
  # since the UI or other scripts can mess with it any time. So the
  # instructions are designed not to interfere with other css classes
  # present in an elements class attribute.
  cssClassChanges: (value) ->
    if @validateValue(value)
      if @type is 'option'
        remove: if not value then [@value] else undefined
        add: value
      else if @type is 'select'
        remove: @otherClasses(value)
        add: value
    else
      if @type is 'option'
        remove: currentValue
        add: undefined
      else if @type is 'select'
        remove: @otherClasses(undefined)
        add: undefined


  validateValue: (value) ->
    if not value
      true
    else if @type is 'option'
      value == @value
    else if @type is 'select'
      @containsOption(value)
    else
      log.warn "Not implemented: DesignStyle#validateValue() for type #{ @type }"


  containsOption: (value) ->
    for option in @options
      return true if value is option.value

    false


  otherOptions: (value) ->
    others = []
    for option in @options
      others.push option if option.value isnt value

    others


  otherClasses: (value) ->
    others = []
    for option in @options
      others.push option.value if option.value isnt value

    others

# Document
# --------
# Manage the document and its dependencies.
# Initialze everyting.
#
# ### Design:
# Manage available Templates
#
# ### Assets:
# Load and manage CSS and Javascript dependencies
# of the designs
#
# ### Content:
# Initialize the SnippetTree.
#
# ### Page:
# Initialize event listeners.
# Link the SnippetTree with the DomTree.
document = do ->

  # Document object
  # ---------------

  initialized: false
  uniqueId: 0
  ready: $.Callbacks('memory once')
  changed: $.Callbacks()


  # *Public API*
  init: ({ design, json, rootNode }={}) ->
    assert not @initialized, 'document is already initialized'
    @initialized = true
    @design = new Design(design)

    @snippetTree = if json && @design
      new SnippetTree(content: json, design: @design)
    else
      new SnippetTree()

    # forward changed event
    @snippetTree.changed.add =>
      @changed.fire()

    # Page initialization
    @page = new InteractivePage(renderNode: rootNode, design: @design)

    # render document
    @renderer = new Renderer
      snippetTree: @snippetTree
      renderingContainer: @page

    @renderer.ready => @ready.fire()


  createView: (parent=window.document.body) ->
    createRendererAndResolvePromise = =>
      page = new Page
        renderNode: iframe.contentDocument.body
        hostWindow: iframe.contentWindow
        design: @design
      renderer = new Renderer
        renderingContainer: page
        snippetTree: @snippetTree
      deferred.resolve
        iframe: iframe
        renderer: renderer

    deferred = $.Deferred()
    $parent = $(parent).first()
    iframe = $parent[0].ownerDocument.createElement('iframe')
    iframe.src = 'about:blank'
    iframe.onload = createRendererAndResolvePromise
    $parent.append(iframe)

    deferred.promise()


  eachContainer: (callback) ->
    @snippetTree.eachContainer(callback)


  # *Public API*
  add: (input) ->
    if jQuery.type(input) == 'string'
      snippet = @createModel(input)
    else
      snippet = input

    @snippetTree.append(snippet) if snippet
    snippet


  # *Public API*
  createModel: (identifier) ->
    template = @getTemplate(identifier)
    template.createModel() if template


  # find all instances of a certain Template
  # e.g. search "bootstrap.hero" or just "hero"
  find: (search) ->
    @snippetTree.find(search)


  # print the SnippetTree
  printTree: () ->
    @snippetTree.print()


  toJson: ->
    json = @snippetTree.toJson()
    json['meta'] =
      title: undefined
      author: undefined
      created: undefined
      published: undefined

    json


  toHtml: ->
    new Renderer(
      snippetTree: @snippetTree
      renderingContainer: new RenderingContainer()
    ).html()


  restore: (contentJson, resetFirst = true) ->
    @reset() if resetFirst
    @snippetTree.fromJson(contentJson, @design)
    @renderer.render()


  reset: ->
    @renderer.clear()
    @snippetTree.detach()


  getTemplate: (identifier) ->
    template = @design?.get(identifier)

    assert template, "could not find template #{ identifier }"

    template

  kickstart: ({ xmlTemplate, scriptNode, destination, design}) ->
    json = new Kickstart({xmlTemplate, scriptNode, design}).getSnippetTree().toJson()
    @init({ design, json, rootNode: destination })

# DOM helper methods
# ------------------
# Methods to parse and update the Dom tree in accordance to
# the SnippetTree and Livingdocs classes and attributes
dom = do ->
  snippetRegex = new RegExp("(?: |^)#{ docClass.snippet }(?: |$)")
  sectionRegex = new RegExp("(?: |^)#{ docClass.section }(?: |$)")

  # Find the snippet this node is contained within.
  # Snippets are marked by a class at the moment.
  findSnippetView: (node) ->
    node = @getElementNode(node)

    while node && node.nodeType == 1 # Node.ELEMENT_NODE == 1
      if snippetRegex.test(node.className)
        view = @getSnippetView(node)
        return view

      node = node.parentNode

    return undefined


  findNodeContext: (node) ->
    node = @getElementNode(node)

    while node && node.nodeType == 1 # Node.ELEMENT_NODE == 1
      nodeContext = @getNodeContext(node)
      return nodeContext if nodeContext

      node = node.parentNode

    return undefined


  getNodeContext: (node) ->
    for directiveType, obj of config.directives
      continue if not obj.elementDirective

      directiveAttr = obj.renderedAttr
      if node.hasAttribute(directiveAttr)
        return {
          contextAttr: directiveAttr
          attrName: node.getAttribute(directiveAttr)
        }

    return undefined


  # Find the container this node is contained within.
  findContainer: (node) ->
    node = @getElementNode(node)
    containerAttr = config.directives.container.renderedAttr

    while node && node.nodeType == 1 # Node.ELEMENT_NODE == 1
      if node.hasAttribute(containerAttr)
        containerName = node.getAttribute(containerAttr)
        if not sectionRegex.test(node.className)
          view = @findSnippetView(node)

        return {
          node: node
          containerName: containerName
          snippetView: view
        }

      node = node.parentNode

    {}


  getImageName: (node) ->
    imageAttr = config.directives.image.renderedAttr
    if node.hasAttribute(imageAttr)
      imageName = node.getAttribute(imageAttr)
      return imageName


  getHtmlElementName: (node) ->
    htmlAttr = config.directives.html.renderedAttr
    if node.hasAttribute(htmlAttr)
      htmlElementName = node.getAttribute(htmlAttr)
      return htmlElementName


  getEditableName: (node) ->
    editableAttr = config.directives.editable.renderedAttr
    if node.hasAttribute(editableAttr)
      imageName = node.getAttribute(editableAttr)
      return editableName



  dropTarget: (node, { top, left }) ->
    node = @getElementNode(node)
    containerAttr = config.directives.container.renderedAttr

    while node && node.nodeType == 1 # Node.ELEMENT_NODE == 1
      if node.hasAttribute(containerAttr)
        containerName = node.getAttribute(containerAttr)
        if not sectionRegex.test(node.className)
          insertSnippet = @getPositionInContainer($(node), { top, left })
          if insertSnippet
            coords = @getInsertPosition(insertSnippet.$elem[0], insertSnippet.position)
            return { snippetView: insertSnippet.snippetView, position: insertSnippet.position, coords }
          else
            view = @findSnippetView(node)
            return { containerName: containerName, parent: view, node: node }

      else if snippetRegex.test(node.className)
        pos = @getPositionInSnippet($(node), { top, left })
        view = @getSnippetView(node)
        coords = @getInsertPosition(node, pos.position)
        return { snippetView: view, position: pos.position, coords }

      else if sectionRegex.test(node.className)
        return { root: true }

      node = node.parentNode

    {}


  getInsertPosition: (elem, position) ->
    rect = @getBoundingClientRect(elem)
    if position == 'before'
      { top: rect.top, left: rect.left, width: rect.width }
    else
      { top: rect.bottom, left: rect.left, width: rect.width }


  # figure out if we should insert before or after snippet
  # based on the cursor position
  getPositionInSnippet: ($elem, { top, left }) ->
    elemTop = $elem.offset().top
    elemHeight = $elem.outerHeight()
    elemBottom = elemTop + elemHeight

    if @distance(top, elemTop) < @distance(top, elemBottom)
      { position: 'before' }
    else
      { position: 'after' }


  # figure out if the user wanted to insert between snippets
  # instead of appending to the container
  # (this can be the case if the drop occurs on a margin)
  getPositionInContainer: ($container, { top, left }) ->
    $snippets = $container.find(".#{ docClass.snippet }")
    closest = undefined
    insertSnippet = undefined

    $snippets.each (index, elem) =>
      $elem = $(elem)
      elemTop = $elem.offset().top
      elemHeight = $elem.outerHeight()
      elemBottom = elemTop + elemHeight

      if not closest or @distance(top, elemTop) < closest
        closest = @distance(top, elemTop)
        insertSnippet = { $elem, position: 'before'}
      if not closest or @distance(top, elemBottom) < closest
        closest = @distance(top, elemBottom)
        insertSnippet = { $elem, position: 'after'}

      if insertSnippet
        insertSnippet.snippetView = @getSnippetView(insertSnippet.$elem[0])

    insertSnippet


  distance: (a, b) ->
    if a > b then a-b else b-a


  # force all containers of a snippet to be as high as they can be
  # sets css style height
  maximizeContainerHeight: (view) ->
    if view.template.containerCount > 1
      for name, elem of view.containers
        $elem = $(elem)
        continue if $elem.hasClass(docClass.maximizedContainer)
        $parent = $elem.parent()
        parentHeight = $parent.height()
        outer = $elem.outerHeight(true) - $elem.height()
        $elem.height(parentHeight - outer)
        $elem.addClass(docClass.maximizedContainer)


  # remove all css style height declarations added by
  # maximizeContainerHeight()
  restoreContainerHeight: () ->
    $(".#{ docClass.maximizedContainer }")
      .css('height', '')
      .removeClass(docClass.maximizedContainer)


  getElementNode: (node) ->
    if node?.jquery
      node[0]
    else if node?.nodeType == 3 # Node.TEXT_NODE == 3
      node.parentNode
    else
      node


  # Snippets store a reference of themselves in their Dom node
  # consider: store reference directly without jQuery
  getSnippetView: (node) ->
    $(node).data('snippet')


  getBoundingClientRect: (node) ->
    coords = node.getBoundingClientRect()

    # code from mdn: https://developer.mozilla.org/en-US/docs/Web/API/window.scrollX
    scrollX = if (window.pageXOffset != undefined) then window.pageXOffset else (document.documentElement || window.document.body.parentNode || window.document.body).scrollLeft
    scrollY = if (window.pageYOffset != undefined) then window.pageYOffset else (document.documentElement || window.document.body.parentNode || window.document.body).scrollTop

    # translate into absolute positions
    coords =
      top: coords.top + scrollY
      bottom: coords.bottom + scrollY
      left: coords.left + scrollX
      right: coords.right + scrollX

    coords.height = coords.bottom - coords.top
    coords.width = coords.right - coords.left

    coords



# DragDrop
#
# to start a drag operation:
# aDragdropInstance.mousedown(...)
#
# options that can be set when creating an instance or overwritten for every drag (applicable in mousedown call)
# @option direct: if true the specified element itself is moved while dragging, otherwise a semi-transparent clone is created
#
# long press:
# @option longpressDelay: miliseconds that the mouse needs to be pressed before drag initiates
# @option longpressDistanceLimit: if the pointer is moved by more pixels during the longpressDelay the drag operation is aborted
#
# click friendly:
# @option minDistance: drag is initialized only if the pointer is moved by a minimal distance
# @option preventDefault: call preventDefault on mousedown (prevents browser drag & drop)
#
# options for a single drag (pass directly to mousedown call)
# @option drag.fixed: set to true for position: fixed elements
# @option drag.mouseToSnippet: e.g. { left: 20, top: 20 }, force position of dragged element relative to cursor
# @option drag.width: e.g. 300, force width of dragged element
# @option drag.onDrop: callback( dragObj, $origin ), will be called after the node is dropped
# @option drag.onDrag: callback( tragTarget, dragObj ), will be called after the node is dropped
# @option drag.onDragStart: callback( dragObj ), will be called after the drag started

class DragDrop

  constructor: (options) ->

    @defaultOptions = $.extend({
        longpressDelay: 0
        longpressDistanceLimit: 10
        minDistance: 0
        direct: false
        preventDefault: true
        createPlaceholder: DragDrop.placeholder
        scrollNearEdge: 50
      }, options)

    # per drag properties
    @drag = {}

    @$origin = undefined
    @$dragged = undefined


  # start a possible drag
  # the drag is only really started if constraints are not violated (longpressDelay and longpressDistanceLimit or minDistance)
  mousedown: ($origin, event, options = {}) ->
    @reset()
    @drag.initialized = true
    @options = $.extend({}, @defaultOptions, options)
    if event.type == 'touchstart'
      @drag.startPoint =
        left: event.originalEvent.changedTouches[0].pageX
        top: event.originalEvent.changedTouches[0].pageY
    else
      @drag.startPoint = { left: event.pageX, top: event.pageY }
    @$origin = $origin

    if @options.longpressDelay and @options.longpressDistanceLimit
      @drag.timeout = setTimeout( =>
        @start()
      , @options.longpressDelay)

    # prevent browser Drag & Drop
    event.preventDefault() if @options.preventDefault


  # start the drag process
  start: ->
    @drag.started = true

    mouseLeft = @drag.startPoint.left
    mouseTop = @drag.startPoint.top

    if typeof @options.onDragStart == 'function'
        @options.onDragStart.call(this, @drag, { left: mouseLeft, top: mouseTop })

    # prevent text-selections while dragging
    $(window.document.body).addClass(docClass.preventSelection)

    if @options.direct
      @$dragged = @$origin
    else
      @$dragged = @options.createPlaceholder(@drag, @$origin)

    if @drag.fixed
      @drag.$body = $(window.document.body)

    # positionDragged
    @move(mouseLeft, mouseTop)

    if !@direct
      @$dragged.appendTo(window.document.body).show()
      @$origin?.addClass(docClass.dragged)


  # only vertical scrolling
  scrollIntoView: (top, event) ->
    if @lastScrollPosition
      delta = top - @lastScrollPosition
      viewportTop = $(window).scrollTop()
      viewportBottom = viewportTop + $(window).height()

      shouldScroll =
        if delta < 0 # upward movement
          inScrollUpArea = top < viewportTop + @defaultOptions.scrollNearEdge
          viewportTop != 0 && inScrollUpArea
        else # downward movement
          abovePageBottom = viewportBottom - $(window).height() < ($(window.document).height())
          inScrollDownArea = top > viewportBottom - @defaultOptions.scrollNearEdge
          abovePageBottom && inScrollDownArea

      window.scrollBy(0, delta) if shouldScroll

    @lastScrollPosition = top


  move: (mouseLeft, mouseTop, event) ->
    if @drag.started
      if @drag.mouseToSnippet
        left = mouseLeft - @drag.mouseToSnippet.left
        top = mouseTop - @drag.mouseToSnippet.top
      else
        left = mouseLeft
        top = mouseTop

      if @drag.fixed
        top = top - @drag.$body.scrollTop()
        left = left - @drag.$body.scrollLeft()

      left = 2 if left < 2
      top = 2 if top < 2

      @$dragged.css({ position:'absolute', left:"#{ left }px", top:"#{ top }px" })
      @scrollIntoView(top, event)
      @dropTarget(mouseLeft, mouseTop, event) if !@direct

    else if @drag.initialized

      # long press measurement of mouse movement prior to drag initialization
      if @options.longpressDelay and @options.longpressDistanceLimit
        @reset() if @distance({ left: mouseLeft, top: mouseTop }, @drag.startPoint) > @options.longpressDistanceLimit

      # delayed initialization after mouse moved a minimal distance
      if @options.minDistance && @distance({ left: mouseLeft, top: mouseTop }, @drag.startPoint) > @options.minDistance
        @start()


  drop: () ->
    if @drag.started

      # drag specific callback
      if typeof @options.onDrop == 'function'
        @options.onDrop.call(this, @drag, @$origin)

    @reset()


  dropTarget: (mouseLeft, mouseTop, event) ->
    if @$dragged && event
      elem = undefined
      if event.type == 'touchstart' || event.type == 'touchmove'
        x = event.originalEvent.changedTouches[0].clientX
        y = event.originalEvent.changedTouches[0].clientY
      else
        x = event.clientX
        y = event.clientY

      # get the element we're currently hovering
      if x && y
        @$dragged.hide()
        # todo: Safari 4 and Opera 10.10 need pageX/Y.
        elem = window.document.elementFromPoint(x, y)
        @$dragged.show()

      # check if a drop is possible
      if elem
        dragTarget = dom.dropTarget(elem, { top: mouseTop, left: mouseLeft })
        @drag.target = dragTarget
      else
        @drag.target = {}

      if typeof @options.onDrag == 'function'
        @options.onDrag.call(this, @drag.target, @drag, { left: mouseLeft, top: mouseTop })


  distance: (pointA, pointB) ->
    return undefined if !pointA || !pointB

    distX = pointA.left - pointB.left
    distY = pointA.top - pointB.top
    Math.sqrt( (distX * distX) + (distY * distY) )


  reset: ->
    if @drag.initialized
      clearTimeout(@drag.timeout) if @drag.timeout
      @drag.preview.remove() if @drag.preview

      if @$dragged and @$dragged != @$origin
        @$dragged.remove()

      if @$origin
        @$origin.removeClass(docClass.dragged)
        @$origin.show()

      $(window.document.body).removeClass(docClass.preventSelection)

      @drag = {}
      @$origin = undefined
      @$dragged = undefined


# Drag preview method -> these are set in the configuration and can be replaced
DragDrop.cloneOrigin = (drag, $origin) ->

  # calculate mouse position relative to snippet
  if !drag.mouseToSnippet
    snippetOffset = $origin.offset()
    marginTop = parseFloat( $origin.css("margin-top") )
    marginLeft = parseFloat( $origin.css("margin-left") )
    drag.mouseToSnippet =
      left: (mouseLeft - snippetOffset.left + marginLeft)
      top: (mouseTop - snippetOffset.top + marginTop)

  # clone snippet
  snippetWidth = drag.width || $origin.width()
  draggedCopy = $origin.clone()

  draggedCopy.css({ position: "absolute", width: snippetWidth })
    .removeClass(docClass.snippetHighlight)
    .addClass(docClass.draggedPlaceholder)

  # set white background on transparent elements
  backgroundColor = $origin.css("background-color")
  hasBackgroundColor = backgroundColor != "transparent" && backgroundColor != "rgba(0, 0, 0, 0)"
  # backgroundSetting = @$origin.css("background") || @$origin.css("background-color")

  if !hasBackgroundColor
    draggedCopy.css({ "background-color": "#fff"})

  return draggedCopy


DragDrop.placeholder = (drag) ->
  snippetWidth = drag.width
  numberOfDraggedElems = 1
  if !drag.mouseToSnippet
    drag.mouseToSnippet =
      left: 2
      top: -15

  template =
    """
    <div class="doc-drag-placeholder-item">
      <span class="doc-drag-counter">#{ numberOfDraggedElems }</span>
      Selected Item
    </div>
    """

  $placeholder = $(template)
  $placeholder.css(width: snippetWidth) if snippetWidth
  $placeholder.css(position: "absolute")




# EditableJS Controller
# ---------------------
# Integrate EditableJS into Livingdocs
class EditableController

  constructor: (@page) ->
    # configure editableJS
    Editable.init
      log: false

    @editableAttr = config.directives.editable.renderedAttr
    @selection = $.Callbacks()

    Editable
      .focus(@withContext(@focus))
      .blur(@withContext(@blur))
      .insert(@withContext(@insert))
      .merge(@withContext(@merge))
      .split(@withContext(@split))
      .selection(@withContext(@selectionChanged))
      .newline(@withContext(@newline))


  # Register DOM nodes with EditableJS.
  # After that Editable will fire events for that node.
  add: (nodes) ->
    Editable.add(nodes)


  disableAll: ->
    $('[contenteditable]').attr('contenteditable', 'false')


  reenableAll: ->
    $('[contenteditable]').attr('contenteditable', 'true')


  # Get view and editableName from the DOM element passed by EditableJS
  #
  # All listeners params get transformed so they get view and editableName
  # instead of element:
  #
  # Example: listener(view, editableName, otherParams...)
  withContext: (func) ->
    (element, args...) =>
      view = dom.findSnippetView(element)
      editableName = element.getAttribute(@editableAttr)
      args.unshift(view, editableName)
      func.apply(this, args)


  updateModel: (view, editableName) ->
    value = view.get(editableName)
    if config.singleLineBreak.test(value) || value == ''
      value = undefined

    view.model.set(editableName, value)


  focus: (view, editableName) ->
    view.focusEditable(editableName)

    element = view.getDirectiveElement(editableName)
    @page.focus.editableFocused(element, view)
    true # enable editableJS default behaviour


  blur: (view, editableName) ->
    view.blurEditable(editableName)

    element = view.getDirectiveElement(editableName)
    @page.focus.editableBlurred(element, view)
    @updateModel(view, editableName)
    true # enable editableJS default behaviour


  insert: (view, editableName, direction, cursor) ->
    if @hasSingleEditable(view)

      snippetName = config.editable.insertSnippet
      template = document.design.get(snippetName)
      copy = template.createModel()

      newView = if direction == 'before'
        view.model.before(copy)
        view.prev()
      else
        view.model.after(copy)
        view.next()

      newView.focus() if newView

    false # disable editableJS default behaviour


  merge: (view, editableName, direction, cursor) ->
    if @hasSingleEditable(view)
      mergedView = if direction == 'before' then view.prev() else view.next()

      if mergedView && mergedView.template == view.template

        # create document fragment
        contents = view.directives.$getElem(editableName).contents()
        frag = @page.document.createDocumentFragment()
        for el in contents
          frag.appendChild(el)

        mergedView.focus()
        elem = mergedView.getDirectiveElement(editableName)
        cursor = Editable.createCursor(elem, if direction == 'before' then 'end' else 'beginning')
        cursor[ if direction == 'before' then 'insertAfter' else 'insertBefore' ](frag)

        # Make sure the model of the mergedView is up to date
        # otherwise bugs like in issue #56 can occur.
        cursor.save()
        @updateModel(mergedView, editableName)
        cursor.restore()

        view.model.remove()
        cursor.setSelection()

    false # disable editableJS default behaviour


  split: (view, editableName, before, after, cursor) ->
    if @hasSingleEditable(view)
      copy = view.template.createModel()

      # get content out of 'before' and 'after'
      beforeContent = before.querySelector('*').innerHTML
      afterContent = after.querySelector('*').innerHTML

      # set editable of snippets to innerHTML of fragments
      view.model.set(editableName, beforeContent)
      copy.set(editableName, afterContent)

      # append and focus copy of snippet
      view.model.after(copy)
      view.next().focus()

    false # disable editableJS default behaviour


  selectionChanged: (view, editableName, selection) ->
    element = view.getDirectiveElement(editableName)
    @selection.fire(view, element, selection)


  newline: (view, editable, cursor) ->
    false # disable editableJS default behaviour


  hasSingleEditable: (view) ->
    view.directives.length == 1 && view.directives[0].type == 'editable'

# Document Focus
# --------------
# Manage the snippet or editable that is currently focused
class Focus

  constructor: ->
    @editableNode = undefined
    @snippetView = undefined

    @snippetFocus = $.Callbacks()
    @snippetBlur = $.Callbacks()


  setFocus: (snippetView, editableNode) ->
    if editableNode != @editableNode
      @resetEditable()
      @editableNode = editableNode

    if snippetView != @snippetView
      @resetSnippetView()
      if snippetView
        @snippetView = snippetView
        @snippetFocus.fire(@snippetView)


  # call after browser focus change
  editableFocused: (editableNode, snippetView) ->
    if @editableNode != editableNode
      snippetView ||= dom.findSnippetView(editableNode)
      @setFocus(snippetView, editableNode)


  # call after browser focus change
  editableBlurred: (editableNode) ->
    if @editableNode == editableNode
      @setFocus(@snippetView, undefined)


  # call after click
  snippetFocused: (snippetView) ->
    if @snippetView != snippetView
      @setFocus(snippetView, undefined)


  blur: ->
    @setFocus(undefined, undefined)


  # Private
  # -------

  # @api private
  resetEditable: ->
    if @editableNode
      @editableNode = undefined


  # @api private
  resetSnippetView: ->
    if @snippetView
      previous = @snippetView
      @snippetView = undefined
      @snippetBlur.fire(previous)



class Kickstart

  constructor: ({ xmlTemplate, scriptNode, destination, design} = {}) ->
    if !(this instanceof Kickstart)
      return new Kickstart({ xmlTemplate, scriptNode, destination, design })

    assert scriptNode || xmlTemplate, 'Please provide parameter "xmlTemplate" or "scriptNode"'

    if scriptNode
      xmlTemplate = "<root>" + $(scriptNode).text() + "</root>"
    
    @template = $.parseXML(xmlTemplate).firstChild
    @design = new Design(design)
    @snippetTree = new SnippetTree()

    @addRootSnippets($(@template).children())


  addRootSnippets: (xmlElements) ->
    for xmlElement, index in xmlElements
      snippetModel = @createSnippet(xmlElement)
      @setChildren(snippetModel, xmlElement)
      row = @snippetTree.append(snippetModel)


  setChildren: (snippetModel, snippetXML) ->
    @populateSnippetContainers(snippetModel, snippetXML)
    @setEditables(snippetModel, snippetXML)
    @setEditableStyles(snippetModel, snippetXML)


  populateSnippetContainers: (snippetModel, snippetXML) ->
    directives = snippetModel.template.directives
    if directives.length == 1 && directives.container
      hasOnlyOneContainer = true
      containerDirective = directives.container[0]

    # add snippets to default container if no other containers exists
    if hasOnlyOneContainer && !@descendants(snippetXML, containerDirective.name).length
      for child in @descendants(snippetXML)
        @appendSnippetToContainer(snippetModel, child, containerDirective.name)

    else
      containers = if snippetModel.containers then Object.keys(snippetModel.containers) else []
      for container in containers
        for editableContainer in @descendants(snippetXML, container)
          for child in @descendants(editableContainer)
            @appendSnippetToContainer(snippetModel, child, @nodeNameToCamelCase(editableContainer))


  appendSnippetToContainer: (snippetModel, snippetXML, region) ->
    snippet = @createSnippet(snippetXML)
    snippetModel.append(region, snippet)
    @setChildren(snippet, snippetXML)


  setEditables: (snippetModel, snippetXML) ->
    for editableName of snippetModel.content
      value = @getValueForEditable(editableName, snippetXML, snippetModel.template.directives.length)
      snippetModel.set(editableName, value) if value


  getValueForEditable: (editableName, snippetXML, directivesQuantity) ->
    child = @descendants(snippetXML, editableName)[0]
    value = @getXmlValue(child)

    if !value && directivesQuantity == 1
      log.warn("The editable '#{editableName}' of '#{@nodeToSnippetName(snippetXML)}' has no content. Display parent HTML instead.")
      value = @getXmlValue(snippetXML)

    value


  nodeNameToCamelCase: (element) ->
    words.camelize(element.nodeName)


  setEditableStyles: (snippetModel, snippetXML) ->
    styles = $(snippetXML).attr(config.kickstart.attr.styles)
    if styles
      styles = styles.split(/\s*;\s*/)
      for style in styles
        style = style.split(/\s*:\s*/)
        snippetModel.setStyle(style[0], style[1]) if style.length > 1


  # Convert a dom element into a camelCase snippetName
  nodeToSnippetName: (element) ->
    snippetName = @nodeNameToCamelCase(element)
    snippet = @design.get(snippetName)

    assert snippet,
      "The Template named '#{snippetName}' does not exist."

    snippetName


  createSnippet: (xml) ->
    @design.get(@nodeToSnippetName(xml)).createModel()


  descendants: (xml, nodeName) ->
    tagLimiter = words.snakeCase(nodeName) if nodeName
    $(xml).children(tagLimiter)


  getXmlValue: (node) ->
    if node
      string = new XMLSerializer().serializeToString(node)
      start = string.indexOf('>') + 1
      end = string.lastIndexOf('<')
      if end > start
        string.substring(start, end)

  getSnippetTree: ->
    @snippetTree

  toHtml: ->
    new Renderer(
      snippetTree: @snippetTree
      renderingContainer: new RenderingContainer()
    ).html()

class Renderer


  constructor: ({ @snippetTree, @renderingContainer }) ->
    assert @snippetTree, 'no snippet tree specified'
    assert @renderingContainer, 'no rendering container specified'

    @$root = $(@renderingContainer.renderNode)
    @setupSnippetTreeListeners()
    @snippetViews = {}

    @readySemaphore = new Semaphore()
    @renderOncePageReady()
    @readySemaphore.start()


  renderOncePageReady: ->
    @readySemaphore.increment()
    @renderingContainer.ready =>
      @render()
      @readySemaphore.decrement()


  ready: (callback) ->
    @readySemaphore.addCallback(callback)


  isReady: ->
    @readySemaphore.isReady()


  html: ->
    assert @isReady(), 'Cannot generate html. Renderer is not ready.'
    @renderingContainer.html()


  # Snippet Tree Event Handling
  # ---------------------------

  setupSnippetTreeListeners: ->
    @snippetTree.snippetAdded.add( $.proxy(@snippetAdded, this) )
    @snippetTree.snippetRemoved.add( $.proxy(@snippetRemoved, this) )
    @snippetTree.snippetMoved.add( $.proxy(@snippetMoved, this) )
    @snippetTree.snippetContentChanged.add( $.proxy(@snippetContentChanged, this) )
    @snippetTree.snippetHtmlChanged.add( $.proxy(@snippetHtmlChanged, this) )


  snippetAdded: (model) ->
    @insertSnippet(model)


  snippetRemoved: (model) ->
    @removeSnippet(model)
    @deleteCachedSnippetViewForSnippet(model)


  snippetMoved: (model) ->
    @removeSnippet(model)
    @insertSnippet(model)


  snippetContentChanged: (model) ->
    @snippetViewForSnippet(model).updateContent()


  snippetHtmlChanged: (model) ->
    @snippetViewForSnippet(model).updateHtml()


  # Rendering
  # ---------


  snippetViewForSnippet: (model) ->
    @snippetViews[model.id] ||= model.createView(@renderingContainer.isReadOnly)


  deleteCachedSnippetViewForSnippet: (model) ->
    delete @snippetViews[model.id]


  render: ->
    @snippetTree.each (model) =>
      @insertSnippet(model)


  clear: ->
    @snippetTree.each (model) =>
      @snippetViewForSnippet(model).setAttachedToDom(false)

    @$root.empty()


  redraw: ->
    @clear()
    @render()


  insertSnippet: (model) ->
    return if @isSnippetAttached(model)

    if @isSnippetAttached(model.previous)
      @insertSnippetAsSibling(model.previous, model)
    else if @isSnippetAttached(model.next)
      @insertSnippetAsSibling(model.next, model)
    else if model.parentContainer
      @appendSnippetToParentContainer(model)
    else
      log.error('Snippet could not be inserted by renderer.')

    snippetView = @snippetViewForSnippet(model)
    snippetView.setAttachedToDom(true)
    @renderingContainer.snippetViewWasInserted(snippetView)
    @attachChildSnippets(model)


  isSnippetAttached: (model) ->
    model && @snippetViewForSnippet(model).isAttachedToDom


  attachChildSnippets: (model) ->
    model.children (childModel) =>
      if not @isSnippetAttached(childModel)
        @insertSnippet(childModel)


  insertSnippetAsSibling: (sibling, model) ->
    method = if sibling == model.previous then 'after' else 'before'
    @$nodeForSnippet(sibling)[method](@$nodeForSnippet(model))


  appendSnippetToParentContainer: (model) ->
    @$nodeForSnippet(model).appendTo(@$nodeForContainer(model.parentContainer))


  $nodeForSnippet: (model) ->
    @snippetViewForSnippet(model).$html


  $nodeForContainer: (container) ->
    if container.isRoot
      @$root
    else
      parentView = @snippetViewForSnippet(container.parentSnippet)
      $(parentView.getDirectiveElement(container.name))


  removeSnippet: (model) ->
    @snippetViewForSnippet(model).setAttachedToDom(false)
    @$nodeForSnippet(model).detach()


class SnippetDrag


  constructor: ({ snippet, page }) ->
    @snippet = snippet
    @page = page
    @$highlightedContainer = {}
    @onStart = $.proxy(@onStart, this)
    @onDrag = $.proxy(@onDrag, this)
    @onDrop = $.proxy(@onDrop, this)
    @classAdded = []


  onStart: () ->
    @page.snippetWillBeDragged.fire(@snippet)

    @$insertPreview = $("<div class='doc-drag-preview'>")
    @page.$body
      .append(@$insertPreview)
      .css('cursor', 'pointer')

    @page.editableController.disableAll()
    @page.blurFocusedElement()

    #todo get all valid containers


  # remeve classes added while dragging from tracked elements
  removeCssClasses: ->
    for $html in @classAdded
      $html
        .removeClass(docClass.afterDrop)
        .removeClass(docClass.beforeDrop)
    @classAdded = []


  isValidTarget: (target) ->
    if target.snippetView && target.snippetView.model != @snippet
      return true
    else if target.containerName
      return true

    false


  onDrag: (target, drag, cursor) ->
    if not @isValidTarget(target)
      $container = target = {}

    if target.containerName
      dom.maximizeContainerHeight(target.parent)
      $container = $(target.node)
    else if target.snippetView
      dom.maximizeContainerHeight(target.snippetView)
      $container = target.snippetView.get$container()
      $container.addClass(docClass.containerHighlight)
    else
      $container = target = {}

    # highlighting
    if $container[0] != @$highlightedContainer[0]
      @$highlightedContainer.removeClass?(docClass.containerHighlight)
      @$highlightedContainer = $container
      @$highlightedContainer.addClass?(docClass.containerHighlight)

    # show drop target
    if target.coords
      coords = target.coords
      @$insertPreview
        .css({ left:"#{ coords.left }px", top:"#{ coords.top - 5}px", width:"#{ coords.width }px" })
        .show()
    else
      @$insertPreview.hide()


  onDrop: (drag) ->
    # @removeCssClasses()
    @page.$body.css('cursor', '')
    @page.editableController.reenableAll()
    @$insertPreview.remove()
    @$highlightedContainer.removeClass?(docClass.containerHighlight)
    dom.restoreContainerHeight()
    target = drag.target

    if target and @isValidTarget(target)
      if snippetView = target.snippetView
        if target.position == 'before'
          snippetView.model.before(@snippet)
        else
          snippetView.model.after(@snippet)
      else if target.containerName
        target.parent.model.append(target.containerName, @snippet)

      @page.snippetWasDropped.fire(@snippet)
    else
      #consider: maybe add a 'drop failed' effect


class SnippetView

  constructor: ({ @model, @$html, @directives, @isReadOnly }) ->
    @template = @model.template
    @isAttachedToDom = false
    @wasAttachedToDom = $.Callbacks();

    unless @isReadOnly
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

# Public API
# ----------
# Since the livingdocs-engine code is contained in its own function closure
# we expose our public API here explicitly.
#
# `doc()`: primary function interface similar to jquery
# with snippet selectors and stuff...
@doc = (search) ->
  document.find(search)

chainable = chainableProxy(doc)

setupApi = ->

  # kickstart the document
  @kickstart = chainable(document, 'kickstart')
  @Kickstart = Kickstart

    # Initialize the document
  @init = chainable(document, 'init')
  @ready = chainable(document.ready, 'add')

  @createView = $.proxy(document, 'createView')

  # Add Templates to the documents
  @getDesign = -> document.design

  # Append a snippet to the document
  # @param input: (String) snippet identifier e.g. "bootstrap.title" or (Snippet)
  # @return SnippetModel
  @add = $.proxy(document, 'add')

  # Create a new snippet instance (not inserted into the document)
  # @param identifier: (String) snippet identifier e.g. "bootstrap.title"
  # @return SnippetModel
  @create = $.proxy(document, 'createModel')

  # Json that can be used for saving of the document
  @toJson = $.proxy(document, 'toJson')
  @toHtml = $.proxy(document, 'toHtml')
  @readableJson = -> words.readableJson( document.toJson() )

  # Print the content of the snippetTree in a readable string
  @printTree = $.proxy(document, 'printTree')

  @eachContainer = chainable(document, 'eachContainer')
  @document = document

  @changed = chainable(document.changed, 'add')
  @DragDrop = DragDrop

  # Stash
  # -----

  stash.init()
  @stash = $.proxy(stash, 'stash')
  @stash.snapshot = $.proxy(stash, 'snapshot')
  @stash.delete = $.proxy(stash, 'delete')
  @stash.restore = $.proxy(stash, 'restore')
  @stash.get = $.proxy(stash, 'get')
  @stash.list = $.proxy(stash, 'list')


  # Utils
  # -----

  # Expose string util 'words'
  @words = words


  # For Plugins & Extensions
  # ------------------------

  # enable snippet finder plugins (jquery like)
  @fn = SnippetArray::


# API methods that are only available after the page has initialized
pageReady = ->
  page = document.page

  @restore = chainable(document, 'restore')

  # Events
  # ------

  # Fired when a snippet is focused
  # callback: (snippetView) ->
  @snippetFocused = chainable(page.focus.snippetFocus, 'add')

  # Fired when a snippet is blurred
  # (always fire before the next focus event)
  # callback: (snippetView) ->
  @snippetBlurred = chainable(page.focus.snippetBlur, 'add')

  # Call to start a drag operation
  @startDrag = $.proxy(page, 'startDrag')

  # Snippet Drag & Drop events
  @snippetWillBeDragged = $.proxy(page.snippetWillBeDragged, 'add')
  @snippetWillBeDragged.remove = $.proxy(page.snippetWillBeDragged, 'remove')
  @snippetWasDropped = $.proxy(page.snippetWasDropped, 'add')
  @snippetWasDropped.remove = $.proxy(page.snippetWasDropped, 'remove')

  # Fired when a user clicks on an editable image
  # example callback method:
  # (snippetView, imageName) -> snippetView.model.set(imageName, imageSrc)
  @imageClick = chainable(page.imageClick, 'add')


  # Fired when a user click on an editable html element or one of its children
  # example callback methods:
  # (snippetView, htmlElementName, event) -> # your code here
  @htmlElementClick = chainable(page.htmlElementClick, 'add')

  # Text Events
  # -----------

  # Fired when editable text is selected
  # callback: (snippetView, element, selection) ->
  # @callbackParam snippetView - snippetView instance
  # @callbackParam element - DOM node with contenteditable
  # @callbackParam selection - selection object from editableJS
  @textSelection = chainable(page.editableController.selection, 'add')


# execute API setup
setupApi.call(doc)
doc.ready ->
  pageReady.call(doc)



