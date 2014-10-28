log = require('../modules/logging/log')
designConfigSchema = require('./design_config_schema')
CssModificatorProperty = require('./css_modificator_property')
Assets = require('./assets')
Template = require('../template/template')
Design = require('./design')


module.exports = designParser =

  parse: (designConfig) ->
    @design = undefined
    if designConfigSchema.validate('design', designConfig)
      @createDesign(designConfig)
    else
      errors = designConfigSchema.getErrorMessages()
      throw new Error(errors)


  createDesign: ({ design, assets, components, componentProperties, groups, defaultComponents }) ->
    try
      @design = @parseDesign(design)
      @parseAssets(assets)
      @parseComponentProperties(componentProperties)
      @parseComponents(components)
      @parseGroups(groups)
      @parseDefaults(defaultComponents)
    catch error
      throw new Error("Error creating the design: #{ error }")

    @design


  parseDesign: (design) ->
    new Design
      name: design.name
      version: design.version


  parseAssets: (assets) ->
    @design.assets = new Assets()


  # Note: Currently componentProperties consist only of design styles
  parseComponentProperties: (componentProperties) ->
    @componentProperties = {}
    for name, config of componentProperties
      @componentProperties[name] = @createComponentProperty(config)


  parseComponents: (components=[]) ->
    for { id, title, html, properties } in components
      properties = @lookupComponentProperties(properties)

      component = new Template
        id: id
        title: title
        html: html
        properties: properties

      @design.add(component)


  lookupComponentProperties: (propertyNames) ->
    properties = {}
    for name in propertyNames || []
      if property = @componentProperties[name]
        properties[name] = property
      else
        log.warn("The componentProperty '#{ name }' was not found.")

    properties


  parseGroups: (groups=[]) ->
    for group in groups
      components = for componentName in group.components
        @design.get(componentName)

      @design.groups.push
        name: group.name
        components: components


  parseDefaults: (defaultComponents) ->
    return unless defaultComponents?
    { paragraph, image } = defaultComponents
    @design.defaultParagraph = @getComponent(paragraph) if paragraph
    @design.defaultImage = @getComponent(image) if image


  getComponent: (name) ->
    component = @design.get(name)
    assert component, "Could not find component #{ name }"
    component


  createComponentProperty: (styleDefinition) ->
    new CssModificatorProperty(styleDefinition)


Design.parser = designParser
