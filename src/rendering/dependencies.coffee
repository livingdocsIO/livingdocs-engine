Dependency = require('./dependency')

module.exports = class Dependencies

  constructor: ({ @componentTree }) ->
    @entries = []
    @namedDependencies = {}
    @componentTree.componentRemoved.add(@onComponentRemoved)


  add: ({ name, js, inlineJs, css, inlineCss, appendToHead, async, component }) ->
    if @isExisting(name) && component?
      dependency = @getByName(name)
      dependency.addComponent(component)
    else
      options = {}
      options['name'] = name
      options['async'] = async
      options['appendToHead'] = appendToHead

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
      @addDependency(dep)


  addDependency: (dependency) ->
    return if @isExisting(dependency)

    @namedDependencies[dependency.name] = dependency if dependency.name
    @entries.push(dependency)


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

