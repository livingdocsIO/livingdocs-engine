editorConfig = require('../configuration/config')
dom = require('../interaction/dom')

module.exports = class Directive

  constructor: ({ name, @type, @elem, config }) ->
    @config = Object.create(editorConfig.directives[@type])
    @name = name || @config.defaultName
    @setConfig(config)
    @optional = false


  setConfig: (config) ->
    $.extend(@config, config)


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
    newDirective = new Directive(name: @name, type: @type, config: @config)
    newDirective.optional = @optional
    newDirective


  getAbsoluteBoundingClientRect: ->
    dom.getAbsoluteBoundingClientRect(@elem)


  getBoundingClientRect: ->
    @elem.getBoundingClientRect()
