class Design

  constructor: (design) ->
    templates = design.templates || design.snippets
    config = design.config
    groups = design.config.groups || design.groups

    @namespace = config?.namespace || 'livingdocs-templates'
    @css = config.css
    @js = config.js #todo
    @fonts = config.fonts #todo
    @templates = {}
    @groups = {}

    @addTemplates(templates)
    @addGroups(groups)


  # pass the name and template in two parameters
  # e.g add('title', '[template]')
  add: (template) ->
    templateObject  = new Template
      namespace: @namespace
      name: template.id
      html: template.html
      title: template.name

    @templates[template.id] = templateObject


  addTemplates: (templates) ->
    for template in templates
      @add(template)


  addGroups: (collection) ->
    for key, group of collection
      templates = {}
      for index, template of group.templates
        templates[template] = @templates[template]

      @groups[key] = new Object
        name: group.name
        templates: templates


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
