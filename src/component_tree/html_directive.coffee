assert = require('../modules/logging/assert')
ComponentDirective = require('./component_directive')

module.exports = class HtmlDirective extends ComponentDirective

  isHtml: true


  setEmbedHandler: (embedHandlerName) ->
    @setData('_embedHandler', embedHandlerName)


  getEmbedHandler: ->
    @getData('_embedHandler')

