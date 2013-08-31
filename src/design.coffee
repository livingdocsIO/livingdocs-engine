class Design

  constructor: (design) ->
    templates = design.templates || design.snippets
    config = design.config
    groups = design.config.groups || design.groups

    @namespace = config?.namespace || 'livingdocs-templates'
    @css = config.css
    @js = config.js #todo
    @fonts = config.fonts #todo
    @templates = []
    @groups = {}

    @addTemplates(templates)
    @addGroups(groups)


  # pass the template as object
  # e.g add({id: "title", name:"Title", html: "<h1 doc-editable>Title</h1>"})
  add: (template) ->
    object = new Template
        namespace: @namespace
        id: template.id
        title: template.title
        styles: template.styles
        html: template.html
        weight: @templates.length + 1

    @templates.push(object)


  addTemplates: (templates) ->
    for template in templates
      @add(template)


  addGroups: (collection) ->
    for key, group of collection
      templates = {}
      for template in group.templates
        templates[template] = @get(template)

      @groups[key] = new Object
        title: group.title
        templates: templates


  remove: (identifier) ->
    @checkNamespace identifier, (id) =>
      @templates.splice(@getIndex(id), 1)


  get: (identifier) ->
    @checkNamespace identifier, (id) =>
      template = undefined
      @each (t, index) ->
        if t.id == id
          template = t

      template


  getIndex: (identifier) ->
    @checkNamespace identifier, (id) =>
      index = undefined
      @each (t, i) ->
        if t.id == id
          index = i

      index


  checkNamespace: (identifier, callback) ->
    { namespace, id } = Template.parseIdentifier(identifier)

    assert not namespace or @namespace is namespace,
      "design #{ @namespace }: cannot get template with different namespace #{ namespace } "

    callback(id)


  each: (callback) ->
    for template, index in @templates
      callback(template, index)


  # list available Templates
  list: ->
    templates = []
    @each (template) ->
      templates.push(template.identifier)

    templates


  # print documentation for a template
  info: (identifier) ->
    template = @get(identifier)
    template.printDoc()
