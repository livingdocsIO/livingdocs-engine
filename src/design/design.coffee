config = require('../configuration/config')
assert = require('../modules/logging/assert')
log = require('../modules/logging/log')
Template = require('../template/template')
OrderedHash = require('../modules/ordered_hash')
Dependencies = require('../rendering/dependencies')

module.exports = class Design

  # @param
  #  - name { String } The name of the design.
  #  - version { String } e.g. '1.0.0'
  #  - author { String }
  #  - description { String }
  constructor: ({ @name, @version, @author, @description }) ->
    assert @name?, 'Design: param "name" is required'
    @identifier = Design.getIdentifier(@name, @version)

    # templates in a structured format
    @groups = []

    # templates by id and sorted
    @components = new OrderedHash()
    @imageRatios = {}

    # js and css dependencies required by the design
    @dependencies = new Dependencies()

    # default components
    @defaultParagraph = undefined
    @defaultImage = undefined


  equals: (design) ->
    design.name == @name && design.version == @version


  # Simple implementation with string comparison
  # Caution: won't work for '1.10.0' > '1.9.0'
  isNewerThan: (design) ->
    return true unless design?
    @version > (design.version || '')


  get: (identifier) ->
    componentName = @getComponentNameFromIdentifier(identifier)
    @components.get(componentName)


  each: (callback) ->
    @components.each(callback)


  add: (template) ->
    template.setDesign(this)
    @components.push(template.name, template)


  getComponentNameFromIdentifier: (identifier) ->
    { name } = Template.parseIdentifier(identifier)
    name


  getDefaultParagraphTemplate: ->
    @defaultParagraph


  getDefaultImageTemplate: ->
    @defaultImage


  getDefaultParagraphComponentName: ->
    @getDefaultParagraphTemplate()?.name


  getDefaultImageComponentName: ->
    @getDefaultImageTemplate()?.name


  getDefaultImageDirectiveName: ->
    @defaultImage?.directives.firstOfType('image')?.name


  @getIdentifier: (name, version) ->
    if version
      "#{ name }@#{ version }"
    else
      "#{ name }"
