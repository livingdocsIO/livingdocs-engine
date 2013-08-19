class Design

  constructor: (design) ->
    templates = design.templates || design.snippets
    config = design.config
    groups = design.groups

    @namespace = config?.namespace || 'livingdocs-templates'
    @css = config.css
    @js = config.js #todo
    @fonts = config.fonts #todo
    @templates = {}
    @groups = {}

    for name, template of templates
      @add(name, template)

    @addGroups(groups)


  # pass the name and template in two parameters
  # e.g add('title', '[template]')
  add: (name, template) ->
    @templates[name] = new Template
      namespace: @namespace
      name: name
      html: template.html
      title: template.name


  addGroups: (collection) ->
    for key, group of collection
      snippets = {}
      for index, snippet of group.snippets
        snippets[snippet] = @templates[snippet]

      @groups[key] = new Object
        name: group.name
        snippets: snippets


  remove: (identifier) ->
    @checkNamespace identifier, (name) =>
      delete @templates[name]


  get: (identifier) ->
    @checkNamespace identifier, (name) =>
      @templates[name]


  checkNamespace: (identifier, callback) ->
    { namespace, name } = Template.parseIdentifier(identifier)

    if not namespace || @namespace == namespace
      callback(name)
    else
      log.error("design #{ @namespace }: cannot get template with different namespace #{ namespace } ")


  each: (callback) ->
    for name, template of @templates
      callback(template)


  # list available Templates
  list: ->
    templates = []
    @each (template) ->
      templates.push(template.identifier)

    templates


  # print documentation for a template
  info: (identifier) ->
    template = @get(identifier)
    template.printDoc()
