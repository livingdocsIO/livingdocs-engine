assert = require('../modules/logging/assert')

module.exports = class Dependency


  # @param {Object}
  #   - type {String} Either 'js' or 'css'
  #
  #   One of the following needs to be provided:
  #   - src {String} URL to a javascript or css file
  #   - code {String} JS or CSS code
  #
  #   All of the following are optional:
  #   - namespace {String} Optional. A Namespace to group dependencies together.
  #   - library {String} Optional. A name to identify and share a library (like jquery) more easily.
  #   - component {ComponentModel} The componentModel that is depending on this resource
  constructor: ({ @type, @src, @code, @namespace, @library, @isExecuteOnly, component }) ->
    assert @src || @code, 'Dependency: No "src" or "code" param provided'
    assert not (@src && @code), 'Dependency: Only provide one of "src" or "code" params'
    assert @type, "Dependency: Param type must be specified"
    assert @type in ['js', 'css'], "Dependency: Unrecognized type: #{ @type }"

    @inline = true if @code?

    @components = {} # components which depend upon this resource
    @componentCount = 0
    @addComponent(component) if component?


  isJs: ->
    @type == 'js'


  isCss: ->
    @type == 'css'


  # Check if this is a dependency of a certain component
  hasComponent: (component) ->
    @components[component.id]?


  addComponent: (component) ->
    if not @hasComponent(component)
      @componentCount += 1
      @components[component.id] = true


  # Remove a component from this dependency.
  # @return {Boolean} true if there are still components
  #   depending on this dependency, otherwise false
  removeComponent: (component) ->
    if @hasComponent(component)
      @componentCount -= 1
      @components[component.id] = undefined

      @componentCount != 0
    else
      true


  isSameAs: (otherDependency) ->
    return false if @type != otherDependency.type
    return false if @namespace != otherDependency.namespace

    if otherDependency.src
      @src == otherDependency.src
    else
      @code == otherDependency.code


  serialize: ->
    assert(not @isExecuteOnly, 'engine//dependency.coffee: Cannot serialize a temporary dependency')

    obj = {}

    for key in ['src', 'code', 'inline', 'library', 'namespace']
      obj[key] = this[key] if this[key]?

    for componentId of @components
      obj.componentIds ?= []
      obj.componentIds.push(componentId)

    obj

