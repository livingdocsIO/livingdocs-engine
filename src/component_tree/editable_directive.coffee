assert = require('../modules/logging/assert')

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
    div = window.document.createElement('div')
    div.innerHTML = content
    div.textContent

