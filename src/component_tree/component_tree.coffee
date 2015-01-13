$ = require('jquery')
assert = require('../modules/logging/assert')
ComponentContainer = require('./component_container')
ComponentArray = require('./component_array')
ComponentModel = require('./component_model')
componentModelSerializer = require('./component_model_serializer')
MetadataExtractor = require('./metadata_extractor')

# ComponentTree
# -----------
# Livingdocs equivalent to the DOM tree.
# A componentTree containes all the components of a page in hierarchical order.
#
# The root of the ComponentTree is a ComponentContainer. A ComponentContainer
# contains a list of components.
#
# components can have multible ComponentContainers themselves.
#
# ### Example:
#     - ComponentContainer (root)
#       - Component 'Hero'
#       - Component '2 Columns'
#         - ComponentContainer 'main'
#           - Component 'Title'
#         - ComponentContainer 'sidebar'
#           - Component 'Info-Box''
#
# ### Events:
# The first set of ComponentTree Events are concerned with layout changes like
# adding, removing or moving components.
#
# Consider: Have a documentFragment as the rootNode if no rootNode is given
# maybe this would help simplify some code (since components are always
# attached to the DOM).
module.exports = class ComponentTree


  constructor: ({ content, @design } = {}) ->
    assert @design?, "Error instantiating ComponentTree: design param is misssing."
    @componentById = {}
    @root = new ComponentContainer(isRoot: true)

    # initialize content before we set the componentTree to the root
    # otherwise all the events will be triggered while building the tree
    @fromJson(content, @design) if content?
    @metadataExtractor = new MetadataExtractor this, @design.metadataConfig

    @root.componentTree = this
    @initializeEvents()


  # Insert a component at the beginning.
  # @param: componentModel instance or component name e.g. 'title'
  prepend: (component) ->
    component = @getComponent(component)
    @root.prepend(component) if component?
    this


  # Insert component at the end.
  # @param: componentModel instance or component name e.g. 'title'
  append: (component) ->
    component = @getComponent(component)
    @root.append(component) if component?
    this


  getComponent: (componentName) ->
    if typeof componentName == 'string'
      @createComponent(componentName)
    else
      componentName


  createComponent: (componentName) ->
    template = @getTemplate(componentName)
    template.createModel() if template


  getTemplate: (componentName) ->
    template = @design.get(componentName)
    assert template, "Could not find template #{ componentName }"
    template


  initializeEvents: () ->

    # layout changes
    @componentAdded = $.Callbacks()
    @componentRemoved = $.Callbacks()
    @componentMoved = $.Callbacks()

    # content changes
    @componentContentChanged = $.Callbacks()
    @componentHtmlChanged = $.Callbacks()
    @componentSettingsChanged = $.Callbacks()
    @componentDataChanged = $.Callbacks()

    @changed = $.Callbacks()


  # Traverse the whole componentTree.
  each: (callback) ->
    @root.each(callback)


  eachContainer: (callback) ->
    @root.eachContainer(callback)


  # Get the first component
  first: ->
    @root.first


  # Traverse all containers and components
  all: (callback) ->
    @root.all(callback)


  find: (search) ->
    if typeof search == 'string'
      res = []
      @each (component) ->
        if component.componentName == search
          res.push(component)

      new ComponentArray(res)
    else
      new ComponentArray()


  findById: (id) ->
    @componentById[id]


  detach: ->
    @root.componentTree = undefined
    @each (component) =>
      component.componentTree = undefined
      @componentById[component.id] = undefined

    oldRoot = @root
    @root = new ComponentContainer(isRoot: true)

    oldRoot


  extractMetadata: ->
    @metadataExtractor.extract()

  # eachWithParents: (component, parents) ->
  #   parents ||= []


  # Set a main view for this componentTree
  # Note: There can be multiple views for a componentTree. With this
  # method we can set a main view so it becomes possible to get a view
  # directly from the componentTree for convenience
  setMainView: (view) ->
    assert view.renderer, 'componentTree.setMainView: view does not have an initialized renderer'
    assert view.renderer.componentTree == this, 'componentTree.setMainView: Cannot set renderer from different componentTree'
    @mainRenderer = view.renderer


  # Get the componentView for a model
  # This only works if setMainView() has been called.
  getMainComponentView: (componentId) ->
    @mainRenderer?.getComponentViewById(componentId)


  # returns a readable string representation of the whole tree
  print: () ->
    output = 'ComponentTree\n-----------\n'

    addLine = (text, indentation = 0) ->
      output += "#{ Array(indentation + 1).join(" ") }#{ text }\n"

    walker = (component, indentation = 0) ->
      template = component.template
      addLine("- #{ template.label } (#{ template.name })", indentation)

      # traverse children
      for name, componentContainer of component.containers
        addLine("#{ name }:", indentation + 2)
        walker(componentContainer.first, indentation + 4) if componentContainer.first

      # traverse siblings
      walker(component.next, indentation) if component.next

    walker(@root.first) if @root.first
    return output


  # Tree Change Events
  # ------------------
  # Raise events for Add, Remove and Move of components
  # These functions should only be called by componentContainers

  attachingComponent: (component, attachComponentFunc) ->
    if component.componentTree == this
      # move component
      attachComponentFunc()
      @fireEvent('componentMoved', component)
    else
      if component.componentTree?
        component.remove() # remove from other componentTree

      component.descendantsAndSelf (descendant) =>
        descendant.componentTree = this
        @componentById[descendant.id] = component

      attachComponentFunc()
      @fireEvent('componentAdded', component)


  fireEvent: (event, args...) ->
    this[event].fire.apply(event, args)
    @changed.fire()


  detachingComponent: (component, detachComponentFunc) ->
    assert component.componentTree is this,
      'cannot remove component from another ComponentTree'

    component.descendantsAndSelf (descendant) =>
      descendant.componentTree = undefined
      @componentById[descendant.id] = undefined

    detachComponentFunc()
    @fireEvent('componentRemoved', component)


  contentChanging: (component) ->
    @fireEvent('componentContentChanged', component)


  htmlChanging: (component) ->
    @fireEvent('componentHtmlChanged', component)


  # Dispatched event description:
  # componentDataChanged(component, changedProperties)
  # @param component {ComponentModel}
  # @param changedProperties {Array of Strings} Top level data properties
  #   that have been changed
  dataChanging: (component, changedProperties) ->
    @fireEvent('componentDataChanged', component, changedProperties)


  # Serialization
  # -------------

  printJson: ->
    words.readableJson(@toJson())


  # Returns a serialized representation of the whole tree
  # that can be sent to the server as JSON.
  serialize: ->
    data = {}
    data['content'] = []
    data['design'] = { name: @design.name }

    componentToData = (component, level, containerArray) ->
      componentData = component.toJson()
      containerArray.push componentData
      componentData

    walker = (component, level, dataObj) ->
      componentData = componentToData(component, level, dataObj)

      # traverse children
      for name, componentContainer of component.containers
        containerArray = componentData.containers[componentContainer.name] = []
        walker(componentContainer.first, level + 1, containerArray) if componentContainer.first

      # traverse siblings
      walker(component.next, level, dataObj) if component.next

    walker(@root.first, 0, data['content']) if @root.first

    data


  # Initialize a componentTree
  # This method suppresses change events in the componentTree by default, can
  # be changed by setting silent = false
  #
  # Consider to change params:
  # fromData({ content, design, silent }) # silent [boolean]: suppress change
  # events
  fromData: (data, design, silent=true) ->
    if design?
      assert not @design? || design.equals(@design), 'Error loading data. Specified design is different from current componentTree design'
    else
      design = @design

    if silent
      @root.componentTree = undefined

    if data.content
      for componentData in data.content
        component = componentModelSerializer.fromJson(componentData, design)
        @root.append(component)

    if silent
      @root.componentTree = this
      @root.each (component) =>
        component.componentTree = this
        @componentById[component.id] = component


  # Append data to this componentTree
  # Fires componentAdded event for every component
  addData: (data, design) ->
    @fromData(data, design, false)


  # Consider extracting animation logic to another level
  addDataWithAnimation: (data, delay=200) ->
    assert @design?, 'Error adding data. ComponentTree has no design'

    timeout = Number(delay)
    for componentData in data.content
      do =>
        content = componentData
        setTimeout =>
          component = componentModelSerializer.fromJson(content, @design)
          @root.append(component)
        , timeout

      timeout += Number(delay)


  toData: ->
    @serialize()


  # Aliases
  # -------

  fromJson: (args...) ->
    @fromData.apply(this, args)


  toJson: (args...) ->
    @toData.apply(this, args)


