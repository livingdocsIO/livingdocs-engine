class Design

  constructor: (config) ->
    @namespace = config?.namespace || 'snippet'
    @css = config.css
    @js = config.js #todo
    @fonts = config.fonts #todo
    @templates = {}


  # either pass an object with many templates as single parameter
  # or the name and template in two parameters
  # e.g add({ [collection] })
  # e.g add('title', '[template]')
  add: (name, template) ->
    if arguments.length == 1
      collection = name
      for name, template of collection
        @add(name, template)

    @templates[name] = new SnippetTemplate
      namespace: @namespace
      name: name
      html: template.html
      title: template.name


  remove: (name) ->
    delete @templates[name]


  get: (name) ->
    @templates[name]


  each: (callback) ->
    for name, template of @template
      callback(template)
