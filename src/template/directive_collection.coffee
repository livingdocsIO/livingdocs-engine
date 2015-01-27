$ = require('jquery')
assert = require('../modules/logging/assert')
config = require('../configuration/config')
Directive = require('./directive')

# A list of all directives of a template
# Every node with an doc- attribute will be stored by its type
module.exports = class DirectiveCollection

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
    directive


  next: (name) ->
    directive = name if name instanceof Directive
    directive ?= @all[name]
    this[directive.index += 1]


  nextOfType: (name) ->
    directive = name if name instanceof Directive
    directive ?= @all[name]

    requiredType = directive.type
    while directive = @next(directive)
      return directive if directive.type is requiredType


  get: (name) ->
    @all[name]


  count: (type) ->
    if type
      this[type]?.length
    else
      @length


  names: (type) ->
    return [] unless this[type]?.length
    for directive in this[type]
      directive.name


  each: (callback) ->
    for directive in this
      callback(directive)


  eachOfType: (type, callback) ->
    if this[type]
      for directive in this[type]
        callback(directive)


  firstOfType: (type) ->
    this[type]?[0]


  eachEditable: (callback) ->
    @eachOfType('editable', callback)


  eachImage: (callback) ->
    @eachOfType('image', callback)


  eachContainer: (callback) ->
    @eachOfType('container', callback)


  eachHtml: (callback) ->
    @eachOfType('html', callback)


  clone: ->
    newCollection = new DirectiveCollection()
    @each (directive) ->
      newCollection.add(directive.clone())

    newCollection


  # helper to directly get element wrapped in a jQuery object
  # todo: rename or better remove
  $getElem: (name) ->
    $(@all[name].elem)


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
