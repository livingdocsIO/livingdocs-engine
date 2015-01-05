assert = require('../modules/logging/assert')

module.exports = class Dependency

  constructor: ({ @name, @source, @type, @inline, @async, @appendToHead }) ->
    assert @source, 'Dependency: No source provided'
    assert @type in ['js', 'css'], "Dependency: Unrecognized type: #{ @type }"

    @inline ?= false # is it inline js or css?
    @appendToHead ?= false # true: append to the head of the document, false: append to body
    if @type == 'css'
      @async = false
    else
      @async ?= false

    @components = {} # components which depend upon this resource
    @componentCount = 0


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
    obj[@type] = @source
    obj.inline = @inline if @inline
    obj.async = @async if @async
    obj.appendToHead = @appendToHead if @appendToHead
    obj.name = @name if @name

    for componentId of @components
      obj.componentIds ?= []
      obj.componentIds.push(componentId)

    obj

