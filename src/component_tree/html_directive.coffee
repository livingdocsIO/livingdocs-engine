assert = require('../modules/logging/assert')

module.exports = class HtmlDirective

  constructor: ({ @snippet, @templateDirective }) ->
    @name = @templateDirective.name
    @type = @templateDirective.type


  isHtml: true


  getContent: ->
    @snippet.content[@name]

