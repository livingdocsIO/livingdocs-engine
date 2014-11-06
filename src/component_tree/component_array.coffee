# jQuery like results when searching for components.
# `doc("hero")` will return a ComponentArray that works similar to a jQuery object.
# For extensibility via plugins we expose the prototype of ComponentArray via `doc.fn`.
module.exports = class ComponentArray


  # @param components: array of components
  constructor: (@components) ->
    @components ?= []
    @createPseudoArray()


  createPseudoArray: () ->
    for result, index in @components
      @[index] = result

    @length = @components.length
    if @components.length
      @first = @[0]
      @last = @[@components.length - 1]


  each: (callback) ->
    for component in @components
      callback(component)

    this


  remove: () ->
    @each (component) ->
      component.remove()

    this
