assert = require('../modules/logging/assert')
words = require('../modules/words')

module.exports = class EditableDirective

  placeholder = null
  placeholderRegexp = null


  constructor: ({ @component, @templateDirective }) ->
    @name = @templateDirective.name
    @type = @templateDirective.type

    if @templateDirective.inputPlaceholder
      placeholder = @templateDirective.inputPlaceholder
        .replace(/^\s+/, '&nbsp;')

      prepared = placeholder
        .replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&")
        .replace(' ', '\\s+')
      placeholderRegexp = new RegExp('^(' + prepared + '|\\s*)$')

      @hasPlaceholder = true


  isEditable: true


  hasPlaceholder: false


  getContent: ->
    @component.content[@name]


  setContent: (value) ->
    @component.setContent(@name, value)


  getText: ->
    content = @getContent()
    return '' unless content
    words.extractTextFromHtml(content)


  getPlaceholder: ->
    placeholder


  isEmptyPlaceholder: (value) ->
    placeholderRegexp.test(value)

