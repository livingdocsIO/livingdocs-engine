$ = require('jquery')
editorConfig = require('../configuration/config')
dom = require('../interaction/dom')
assert = require('../modules/logging/assert')

module.exports = class Directive

  constructor: ({ @name, @type, @elem, config }) ->
    if @type != 'optional'
      assert @name, "TemplateDirective: name is missing from #{ @type } directive"

    @config = Object.create(editorConfig.directives[@type])
    @setConfig(config)
    @optional = false


  setConfig: (config) ->
    $.extend(@config, config)


  renderedAttr: ->
    @config.renderedAttr


  overwritesContent: ->
    !!@config.overwritesContent


  isModification: ->
    @config.modifies?


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
