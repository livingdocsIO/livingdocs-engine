assert = require('../modules/logging/assert')

module.exports = class EditableDirective

  constructor: ({ @component, @templateDirective }) ->
    @name = @templateDirective.name
    @type = @templateDirective.type


  isEditable: true


  getContent: ->
    @component.content[@name]
