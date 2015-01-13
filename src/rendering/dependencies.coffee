Dependency = require('./dependency')
log = require('../modules/logging/log')

module.exports = class Dependencies

  constructor: ({ @componentTree }) ->
    @entries = []
    @namedDependencies = {}
    @componentTree.componentRemoved.add(@onComponentRemoved)


  # Add a dependency
  add: (obj) ->
    dep = new Dependency(obj)
    if existing = @getExisting(dep) && component?
      existing.addComponent(component)
    else
      @addDependency(dep)


  addJs: (obj) ->
    obj.type = 'js'
    @add(obj)


  addCss: (obj) ->
    obj.type = 'css'
    @add(obj)


  addDependency: (dependency) ->
    return if existing = @getExisting(dependency)

    @namedDependencies[dependency.name] = dependency if dependency.name
    @entries.push(dependency)
    dependency


  getExisting: (dep) ->
    for entry in @entries
      return entry if entry.isSameAs(dep)

    undefined


  # todo: remove
  isExisting: (name) ->
    @namedDependencies[name]?


  hasEntries: ->
    @entries.length > 0


  getByName: (name) ->
    @namedDependencies[name]


  onComponentRemoved: (component) =>
    toBeRemoved = []
    for dependency in @entries
      needed = dependency.removeComponent(component)
      toBeRemoved.push(dependency) if not needed

    for dependency in toBeRemoved
      @removeDependency(dependency)


  removeDependency: (dependency) ->
    @namedDependencies[dependency.name] = undefined if dependency.name
    index = @entries.indexOf(dependency)
    @entries.splice(index, 1) if index > -1


  serialize: ->
    data = {}
    for dependency in @entries
      if dependency.type == 'js'
        data['js'] ?= []
        data['js'].push( dependency.serialize() )
      else if dependency.type == 'css'
        data['css'] ?= []
        data['css'].push( dependency.serialize() )

    data


  deserialize: (data) ->
    return unless data?

    # js
    for entry in data.js || []
      obj =
        type: 'js'
        name: entry.name
        src: entry.src
        code: entry.code
        async: entry.async

      @addDeserialzedObj(obj, entry)

    # css
    for entry in data.css || []
      obj =
        type: 'css'
        name: entry.name
        src: entry.src
        code: entry.code

      @addDeserialzedObj(obj, entry)


  addDeserialzedObj: (obj, entry) ->
    if entry.componentIds?.length
      components = []
      for id in entry.componentIds
        component = @componentTree.findById(id)
        components.push(component) if component?

      # only add the dependency if there are still components
      # depending on it
      if components.length
        dependency = @add(obj)
        for component in components
          dependency.addComponent(component)
      else
        log.warn('Dropped dependency: could not find components that depend on it', entry)
    else
      @add(obj)

