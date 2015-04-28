assert = require('../modules/logging/assert')

# ComponentContainer
# ----------------
# A ComponentContainer contains and manages a linked list
# of components.
#
# The componentContainer is responsible for keeping its componentTree
# informed about changes (only if they are attached to one).
#
# @prop first: first component in the container
# @prop last: last component in the container
# @prop parentComponent: parent ComponentModel
module.exports = class ComponentContainer


  constructor: ({ @parentComponent, @name, isRoot, config }) ->
    @isRoot = isRoot?
    @first = @last = undefined
    @allowedChildren = undefined # undefined means all component are allowed
    @parseConfig(config)


  # @param configuration:
  #   - only {Array} Array of componentNames
  parseConfig: (configuration) ->
    return unless configuration?

    for componentName in configuration.allowedChildren || []
      @allowedChildren ?= {}
      @allowedChildren[componentName] = true


  # Nesting Validations
  # -------------------

  # @param {ComponentModel}
  isAllowedAsChild: (component) ->
    !!( @canBeNested(component.id) &&
      @isChildAllowed(component.template) &&
      @isAllowedAsParent(component.template) )


  # @param {Template}
  isTypeAllowedAsChild: (template) ->
    return false unless template?
    !!( @isChildAllowed(template) &&
      @isAllowedAsParent(template) )



  # Prevent inserting a component into itself.
  canBeNested: (componentId) ->
    parent = @parentComponent
    while parent?
      return false if parent.id == componentId
      parent = parent.getParent()

    return true


  # Check if the configuration allows a component to be
  # inserted here.
  isChildAllowed: (template) ->
    @allowedChildren == undefined || @allowedChildren[template.name]


  isAllowedAsParent: (template) ->
    return true unless allowedParents = template.allowedParents

    parentName = if @isRoot then 'root' else @parentComponent?.componentName

    for allowed in allowedParents
      return true if parentName == allowed

    return false


  # ComponentTree operations
  # ------------------------

  getComponentTree: ->
    @componentTree || @parentComponent?.componentTree


  prepend: (component) ->
    if @first
      @insertBefore(@first, component)
    else
      @attachComponent(component)

    this


  append: (component) ->
    if @parentComponent
      assert component isnt @parentComponent, 'cannot append component to itself'

    if @last
      @insertAfter(@last, component)
    else
      @attachComponent(component)

    this


  insertBefore: (component, insertedComponent) ->
    return if component.previous == insertedComponent
    assert component isnt insertedComponent, 'cannot insert component before itself'

    position =
      previous: component.previous
      next: component
      parentContainer: component.parentContainer

    @attachComponent(insertedComponent, position)


  insertAfter: (component, insertedComponent) ->
    return if component.next == insertedComponent
    assert component isnt insertedComponent, 'cannot insert component after itself'

    position =
      previous: component
      next: component.next
      parentContainer: component.parentContainer

    @attachComponent(insertedComponent, position)


  up: (component) ->
    if component.previous?
      @insertBefore(component.previous, component)


  down: (component) ->
    if component.next?
      @insertAfter(component.next, component)


  remove: (component) ->
    component.destroy()
    @_detachComponent(component)


  # Iterators
  # ---------

  # Traverse all components
  each: (callback) ->
    component = @first
    while (component)
      component.descendantsAndSelf(callback)
      component = component.next


  eachContainer: (callback) ->
    callback(this)
    @each (component) ->
      for name, componentContainer of component.containers
        callback(componentContainer)


  # Traverse all components and containers
  all: (callback) ->
    callback(this)
    @each (component) ->
      callback(component)
      for name, componentContainer of component.containers
        callback(componentContainer)


  # Private
  # -------

  # Every component added or moved most come through here.
  # Notifies the componentTree if the parent component is
  # attached to one.
  # @api private
  attachComponent: (component, position = {}) ->
    assert(@isAllowedAsChild(component), "Component '#{ component.componentName }' is not allowed as a child of #{ @getContainerIdentifier() }")

    func = =>
      @link(component, position)

    if componentTree = @getComponentTree()
      componentTree.attachingComponent(component, func)
    else
      func()


  # Every component that is removed must come through here.
  # Notifies the componentTree if the parent component is
  # attached to one.
  # Components that are moved inside a componentTree should not
  # call _detachComponent since we don't want to fire
  # ComponentRemoved events on the componentTree, in these
  # cases unlink can be used
  # @api private
  _detachComponent: (component) ->
    func = =>
      @unlink(component)

    if componentTree = @getComponentTree()
      componentTree.detachingComponent(component, func)
    else
      func()


  # @api private
  link: (component, position) ->
    @unlink(component) if component.parentContainer

    position.parentContainer ||= this
    @setComponentPosition(component, position)


  # @api private
  unlink: (component) ->
    container = component.parentContainer
    if container

      # update parentContainer links
      container.first = component.next unless component.previous?
      container.last = component.previous unless component.next?

      # update previous and next nodes
      component.next?.previous = component.previous
      component.previous?.next = component.next

      @setComponentPosition(component, {})


  # @api private
  setComponentPosition: (component, { parentContainer, previous, next }) ->
    component.parentContainer = parentContainer
    component.previous = previous
    component.next = next

    if parentContainer
      previous.next = component if previous
      next.previous = component if next
      parentContainer.first = component unless component.previous?
      parentContainer.last = component unless component.next?


  # Helper method for debugging and error messages
  getContainerIdentifier: ->
    if @isRoot
      'root'
    else
      "#{ @parentComponent.componentName }.containers['#{ @name }']"

