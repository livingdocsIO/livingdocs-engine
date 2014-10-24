log = require('../modules/logging/log')
designConfigSchema = require('./design_config_schema')
CssModificatorProperty = require('./css_modificator_property')
Assets = require('./assets')
Template = require('../template/template')
Design = require('./new_design')

module.exports =

  parse: (designConfig) ->
    @errors = designConfigSchema.validate(designConfig)
    return false if @errors?

    if @tryDesignCreation(designConfig) then @design else false


  tryDesignCreation: ({ design, assets, components, componentProperties, groups, styles }) ->
    try
      @design = @parseDesign(design)
      @parseAssets(assets)
      @parseComponentProperties(componentProperties)
      @parseComponents(components)
    catch error
      log.warn "Error parsing design config: #{ error }"
      return false


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
    @design.orderedComponents = []
    for { id, title, html, properties } in components
      properties = @lookupComponentProperties()
      component = new Template
        namespace: @design.name
        id: id
        title: title
        html: html
        properties: properties

      @design.orderedComponents.push component
      @design.components[id] = component


  lookupComponentProperties: (propertyNames) ->
    properties = []
    for name in propertyNames || []
      if property = @componentProperties[name]?
        properties.push(property)
      else
        log.warn("The componentProperty '#{ name }' was not found.")

    if properties.length then properties else undefined


  createComponentProperty: (styleDefinition) ->
    new CssModificatorProperty(styleDefinition)

