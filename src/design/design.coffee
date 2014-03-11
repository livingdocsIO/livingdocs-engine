assert = require('../modules/logging/assert')
log = require('../modules/logging/log')
Template = require('../template/template')
DesignStyle = require('./design_style')

module.exports = class Design

  constructor: (design) ->
    templates = design.templates || design.snippets
    config = design.config
    groups = design.config.groups || design.groups

    @namespace = config?.namespace || 'livingdocs-templates'
    @paragraphSnippet = config?.paragraph || 'text'
    @css = config.css
    @js = config.js
    @fonts = config.fonts
    @templates = []
    @groups = {}
    @styles = {}

    @storeTemplateDefinitions(templates)
    @globalStyles = @createDesignStyleCollection(design.config.styles)
    @addGroups(groups)
    @addTemplatesNotInGroups()


  storeTemplateDefinitions: (templates) ->
    @templateDefinitions = {}
    for template in templates
      @templateDefinitions[template.id] = template


  # pass the template as object
  # e.g add({id: "title", name:"Title", html: "<h1 doc-editable>Title</h1>"})
  add: (templateDefinition, styles) ->
    @templateDefinitions[templateDefinition.id] = undefined
    templateOnlyStyles = @createDesignStyleCollection(templateDefinition.styles)
    templateStyles = $.extend({}, styles, templateOnlyStyles)

    template = new Template
      namespace: @namespace
      id: templateDefinition.id
      title: templateDefinition.title
      styles: templateStyles
      html: templateDefinition.html
      weight: templateDefinition.sortOrder || 0

    @templates.push(template)
    template


  addGroups: (collection) ->
    for groupName, group of collection
      groupOnlyStyles = @createDesignStyleCollection(group.styles)
      groupStyles = $.extend({}, @globalStyles, groupOnlyStyles)

      templates = {}
      for templateId in group.templates
        templateDefinition = @templateDefinitions[templateId]
        if templateDefinition
          template = @add(templateDefinition, groupStyles)
          templates[template.id] = template
        else
          log.warn("The template '#{templateId}' referenced in the group '#{groupName}' does not exist.")

      @addGroup(groupName, group, templates)


  addTemplatesNotInGroups: (globalStyles) ->
    for templateId, templateDefinition of @templateDefinitions
      if templateDefinition
        @add(templateDefinition, @globalStyles)


  addGroup: (name, group, templates) ->
    @groups[name] =
      title: group.title
      templates: templates


  createDesignStyleCollection: (styles) ->
    designStyles = {}
    if styles
      for styleDefinition in styles
        designStyle = @createDesignStyle(styleDefinition)
        designStyles[designStyle.name] = designStyle if designStyle

    designStyles


  createDesignStyle: (styleDefinition) ->
    if styleDefinition && styleDefinition.name
      new DesignStyle
        name: styleDefinition.name
        type: styleDefinition.type
        options: styleDefinition.options
        value: styleDefinition.value


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
