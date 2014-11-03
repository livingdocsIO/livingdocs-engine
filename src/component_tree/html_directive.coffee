assert = require('../modules/logging/assert')

module.exports = class HtmlDirective

  constructor: ({ @component, @templateDirective }) ->
    @name = @templateDirective.name
    @type = @templateDirective.type


  isHtml: true


  getContent: ->
    @component.content[@name]

