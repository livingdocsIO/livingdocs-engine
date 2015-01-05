assert = require('../modules/logging/assert')
words = require('../modules/words')

module.exports = class EditableDirective

  constructor: ({ @component, @templateDirective }) ->
    @name = @templateDirective.name
    @type = @templateDirective.type


  isEditable: true


  getContent: ->
    @component.content[@name]


  setContent: (value) ->
    @component.setContent(@name, value)


  getText: ->
    content = @getContent()
    return '' unless content
    words.extractTextFromHtml(content)

