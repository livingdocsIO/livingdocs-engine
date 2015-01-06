Dependency = require('./dependency')
log = require('../modules/logging/log')

module.exports = class Dependencies

  constructor: ({ @componentTree }) ->
    @entries = []
    @namedDependencies = {}
    @componentTree.componentRemoved.add(@onComponentRemoved)


  # Add a dependency
  #
  # The biggest limitation at the moment is that you can only
  # register one dependency per type (js or css) per component.
  #
  # @param {Object}
  #   One of the following needs to be provided:
  #   - js {String} URL to a javascript file
  #   - inlineJs {String} js code
  #   - css {String} URL to a css file
  #   - inlineCss {String} css code
  #
  #   And all of the following are optional:
  #   - name {String} Optional. A Name to identify the dependency
  #   - async {Boolean} only valid for js urls
  #   - component {ComponentModel} The componentModel that is depending on this resource
  add: ({ js, inlineJs, css, inlineCss, name, async, component }) ->
    if @isExisting(name) && component?
      dependency = @getByName(name)
      dependency.addComponent(component)
    else
      options = {}
      options['name'] = name
      options['async'] = async

      if js?
        options['source'] = js
        options['type'] = 'js'
      else if inlineJs?
        options['source'] = inlineJs
        options['type'] = 'js'
        options['inline'] = true
      else if css?
        options['source'] = css
        options['type'] = 'css'
      else if inlineCss?
        options['source'] = inlineCss
        options['type'] = 'css'
        options['inline'] = true

      dep = new Dependency(options)
      dep.addComponent(component) if component?
      @addDependency(dep)


  addDependency: (dependency) ->
    return if @isExisting(dependency.name)

    @namedDependencies[dependency.name] = dependency if dependency.name
    @entries.push(dependency)
    dependency


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
        name: entry.name
        async: entry.async

      if entry.inline then obj.inlineJs = entry.code else obj.js = entry.src
      @addDeserialzedObj(obj, entry)

    # css
    for entry in data.css || []
      obj =
        name: entry.name

      if entry.inline then obj.inlineCss = entry.code else obj.css = entry.src
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

