log = require('../modules/logging/log')
assert = require('../modules/logging/assert')
designConfigSchema = require('./design_config_schema')
CssModificatorProperty = require('./css_modificator_property')
Template = require('../template/template')
Design = require('./design')
Version = require('./version')


module.exports = designParser =

  parse: (designConfig) ->
    @design = undefined
    if designConfigSchema.validate('design', designConfig)
      @createDesign(designConfig)
    else
      errors = designConfigSchema.getErrorMessages()
      throw new Error(errors)


  createDesign: (designConfig) ->
    { assets, components, componentProperties, groups, defaultComponents } = designConfig
    try
      @design = @parseDesignInfo(designConfig)
      @parseAssets(assets)
      @parseComponentProperties(componentProperties)
      @parseComponents(components)
      @parseGroups(groups)
      @parseDefaults(defaultComponents)
    catch error
      throw new Error("Error creating the design: #{ error }")

    @design


  parseDesignInfo: (design) ->
    version = new Version(design.version)
    new Design
      name: design.name
      version: version.toString()


  parseAssets: (assets) ->
    return unless assets?
    @design.assets.addCss(assets.css)
    @design.assets.addJs(assets.js)


  # Note: Currently componentProperties consist only of design styles
  parseComponentProperties: (componentProperties) ->
    @componentProperties = {}
    for name, config of componentProperties
      config.name = name
      @componentProperties[name] = @createComponentProperty(config)


  parseComponents: (components=[]) ->
    for { name, label, html, properties } in components
      properties = @lookupComponentProperties(properties)

      component = new Template
        name: name
        label: label
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
        label: group.label
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
