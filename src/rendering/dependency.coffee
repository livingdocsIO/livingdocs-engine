assert = require('../modules/logging/assert')

module.exports = class Dependency

  constructor: ({ @name, @src, @code, @type, @async, component }) ->
    assert @src || @code, 'Dependency: No "src" or "code" param provided'
    assert not (@src && @code), 'Dependency: Only provide one of "src" or "code" params'
    assert @type in ['js', 'css'], "Dependency: Unrecognized type: #{ @type }"

    @inline = true if @code?
    if @type == 'css' || @inline == true
      @async = undefined

    @components = {} # components which depend upon this resource
    @componentCount = 0
    @addComponent(component) if component?


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


  serialize: ->
    obj = {}

    obj.src = @src if @src?
    obj.code = @code if @code?
    obj.inline = @inline if @inline?
    obj.async = @async if @async?
    obj.name = @name if @name

    for componentId of @components
      obj.componentIds ?= []
      obj.componentIds.push(componentId)

    obj

