assert = require('../modules/logging/assert')
log = require('../modules/logging/log')

module.exports = class Design

  constructor: ({ @name, @version, @author, @description }) ->

    # templates in a structured format
    @groups = []

    # templates by id
    @components = {}
    @orderedComponents = []

    # assets required by the design
    @assets = undefined

    @defaultComponents =
      paragraph: undefined
      image: undefined


  equals: (design) ->
    design.name == @name && design.version == @version


  get: (identifier) ->
    componentName = @getComponentNameFromIdentifier(identifier)
    @components[componentName]


  each: (callback) ->
    for componentTemplate in @orderedComponents
      callback(componentTemplate)


  getComponentNameFromIdentifier: (identifier, callback) ->
    { namespace, id } = Template.parseIdentifier(identifier)
    id
