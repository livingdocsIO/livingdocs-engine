Dependency = require('./dependency')
log = require('../modules/logging/log')
assert = require('../modules/logging/assert')
$ = require('jquery')

module.exports = class Dependencies

  # @param {ComponentTree} optional. Required if you want to
  #   track which components use a dependency.
  # @param {String} optional. Prefix relative urls with this string
  #   (the string should not have a slash at the end).
  # @param {Boolean} optional. Whether to allow relative urls or not.
  #   Defaults to false.
  constructor: ({ @componentTree, @prefix, allowRelativeUrls }={}) ->
    @allowRelativeUrls = if @prefix then true else allowRelativeUrls || false
    @prefix ?= ''


    @js = []
    @css = []
    @namedDependencies = {}

    @dependencyAdded = $.Callbacks()
    @dependencyRemoved = $.Callbacks()

    if @componentTree?
      @componentTree.componentRemoved.add(@onComponentRemoved)


  # Add a dependency
  add: (obj) ->
    @convertToAbsolutePaths(obj)
    dep = new Dependency(obj)
    if existing = @getExisting(dep)
      existing.addComponent(component) if component?
    else
      @addDependency(dep)


  addJs: (obj) ->
    obj.type = 'js'
    @add(obj)


  addCss: (obj) ->
    obj.type = 'css'
    @add(obj)


  # Absolute paths:
  # //
  # /
  # http://google.com
  # https://google.com
  #
  # Everything else is prefixed if a prefix is provided.
  # To explicitly pass a relative URL start it with './'
  convertToAbsolutePaths: (obj) ->
    return unless obj.src
    src = obj.src

    if not @isAbsoluteUrl(src)
      assert @allowRelativeUrls, "Dependencies: relative urls are not allowed: #{ src }"
      src = src.replace(/^[\.\/]*/, '')
      obj.src = "#{ @prefix }/#{ src }"


  isAbsoluteUrl: (src) ->
    # URLs are absolute when they contain two `//` or begin with a `/`
    /(^\/\/|[a-z]*:\/\/)/.test(src) || /^\//.test(src)


  addDependency: (dependency) ->
    @namedDependencies[dependency.name] = dependency if dependency.name
    collection = if dependency.isJs() then @js else @css
    collection.push(dependency)

    @dependencyAdded.fire(dependency)

    dependency


  getExisting: (dep) ->
    collection = if dep.isJs() then @js else @css
    for entry in collection
      return entry if entry.isSameAs(dep)

    undefined


  hasCss: ->
    @css.length > 0


  hasJs: ->
    @js.length > 0


  getByName: (name) ->
    @namedDependencies[name]


  onComponentRemoved: (component) =>
    toBeRemoved = []
    for dependency in @js
      needed = dependency.removeComponent(component)
      toBeRemoved.push(dependency) if not needed

    for dependency in @css
      needed = dependency.removeComponent(component)
      toBeRemoved.push(dependency) if not needed

    for dependency in toBeRemoved
      @removeDependency(dependency)


  removeDependency: (dependency) ->
    @namedDependencies[dependency.name] = undefined if dependency.name
    collection = if dependency.isJs() then @js else @css
    index = collection.indexOf(dependency)
    collection.splice(index, 1) if index > -1

    @dependencyRemoved.fire(dependency)


  serialize: ->
    data = {}
    for dependency in @js
      data['js'] ?= []
      data['js'].push( dependency.serialize() )

    for dependency in @css
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

