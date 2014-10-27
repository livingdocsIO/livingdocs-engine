assert = require('../modules/logging/assert')
log = require('../modules/logging/log')
Template = require('../template/template')
OrderedHash = require('../modules/ordered_hash')

module.exports = class Design

  constructor: ({ @name, @version, @author, @description }) ->

    # templates in a structured format
    @groups = []

    # templates by id and sorted
    @components = new OrderedHash()

    # assets required by the design
    @assets = undefined

    @defaultComponents =
      paragraph: undefined
      image: undefined


  equals: (design) ->
    design.name == @name && design.version == @version


  get: (identifier) ->
    componentName = @getComponentNameFromIdentifier(identifier)
    @components.get(componentName)


  each: (callback) ->
    @components.each(callback)


  getComponentNameFromIdentifier: (identifier) ->
    { namespace, id } = Template.parseIdentifier(identifier)
    id
