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


  # pass the template as object
  # e.g add({id: "title", name:"Title", html: "<h1 doc-editable>Title</h1>"})
  add: (template) ->
    @templates[template.id] = new Template
      namespace: @namespace
      name: template.id
      html: template.html
      title: template.name


  addTemplates: (templates) ->
    for template in templates
      @add(template)


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
