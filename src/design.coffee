class Design

  constructor: (config) ->
    @namespace = config?.namespace || 'livingdocs-templates'
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


  remove: (identifier) ->
    @checkNamespace identifier, (name) =>
      delete @templates[name]


  get: (identifier) ->
    @checkNamespace identifier, (name) =>
      @templates[name]


  checkNamespace: (identifier, callback) ->
    { namespace, name } = SnippetTemplate.parseIdentifier(identifier)

    if not namespace || @namespace == namespace
      callback(name)
    else
      log.error("design #{ @namespace }: cannot get template with different namespace #{ namespace } ")


  each: (callback) ->
    for name, template of @template
      callback(template)
