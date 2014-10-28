assert = require('../modules/logging/assert')
log = require('../modules/logging/log')
Template = require('../template/template')
OrderedHash = require('../modules/ordered_hash')

module.exports = class Design

  constructor: ({ @name, @version, @author, @description }) ->
    assert @name?, 'Design needs a name'
    @identifier = Design.getIdentifier(@name, @version)

    # templates in a structured format
    @groups = []

    # templates by id and sorted
    @components = new OrderedHash()

    # assets required by the design
    @assets = undefined

    # default components
    @defaultParagraph = undefined
    @defaultImage = undefined


  equals: (design) ->
    design.name == @name && design.version == @version


  get: (identifier) ->
    componentName = @getComponentNameFromIdentifier(identifier)
    @components.get(componentName)


  each: (callback) ->
    @components.each(callback)


  add: (template) ->
    template.setDesign(this)
    @components.push(template.id, template)


  getComponentNameFromIdentifier: (identifier) ->
    { namespace, id } = Template.parseIdentifier(identifier)
    id


  @getIdentifier: (name, version) ->
    if version?
      "#{ name }@#{ version }"
    else
      "#{ name }"
