config = require('../configuration/config')
dom = require('../interaction/dom')

module.exports = class Directive

  constructor: ({ name, @type, @elem }) ->
    @name = name || config.directives[@type].defaultName
    @config = config.directives[@type]
    @optional = false


  renderedAttr: ->
    @config.renderedAttr


  isElementDirective: ->
    @config.elementDirective


  # Return the nodeName in lower case
  getTagName: ->
    @elem.nodeName.toLowerCase()


  # For every new ComponentView the directives are cloned from the
  # template and linked with the elements from the new view
  clone: ->
    newDirective = new Directive(name: @name, type: @type)
    newDirective.optional = @optional
    newDirective


  getAbsoluteBoundingClientRect: ->
    dom.getAbsoluteBoundingClientRect(@elem)


  getBoundingClientRect: ->
    @elem.getBoundingClientRect()
