assert = require('../modules/logging/assert')
words = require('../modules/words')
ComponentDirective = require('./component_directive')

module.exports = class EditableDirective extends ComponentDirective

  isEditable: true


  getText: ->
    content = @getContent()
    return '' unless content
    words.extractTextFromHtml(content)

