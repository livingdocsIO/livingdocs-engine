config = require('../configuration/config')
assert = require('../modules/logging/assert')
log = require('../modules/logging/log')
words = require('../modules/words')
Template = require('../template/template')
OrderedHash = require('../modules/ordered_hash')
Dependencies = require('../rendering/dependencies')
_ = require('underscore')

module.exports = class Design

  # @param
  #  - name { String } The name of the design.
  #  - version { String } e.g. '1.0.0'
  #  - author { String }
  #  - description { String }
  constructor: ({ @name, @version, label, @author, @description }) ->
    assert @name?, 'Design: param "name" is required'
    @label = label || words.humanize(@name)

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


  # @returns {Template}
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


  # Transforms
  # ----------

  getTransformOptions: ({ template, oneWay, directives }) ->
    oneWay ?= false
    transforms = []
    @components.each (other) ->
      return if template.equals(other)

      compatibility = template.isCompatible(other, { oneWay, directives })

      if compatibility.isCompatible
        compatibility.template = other
        transforms.push(compatibility)

    return if transforms.length then transforms else undefined


  # Default Components
  # ------------------

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


  getLayout: (name) ->
    return wrapper: @wrapper unless @layouts
    return _.first(@layouts) unless name? or @defaultLayout?

    name ?= @defaultLayout
    _.findWhere(@layouts, name: name)


  @getIdentifier: (name, version) ->
    if version
      "#{ name }@#{ version }"
    else
      "#{ name }"
