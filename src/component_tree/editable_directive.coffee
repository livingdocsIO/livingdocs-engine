assert = require('../modules/logging/assert')

module.exports = class EditableDirective

  constructor: ({ @snippet, @templateDirective }) ->
    @name = @templateDirective.name
    @type = @templateDirective.type


  isEditable: true


  getContent: ->
    @snippet.content[@name]
