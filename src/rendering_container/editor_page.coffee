config = require('../configuration/config')
css = config.css
DragBase = require('../interaction/drag_base')
SnippetDrag = require('../interaction/snippet_drag')

module.exports = class EditorPage

  constructor: ->
    @setWindow()
    @dragBase = new DragBase(this)

    # Stubs
    @editableController =
      disableAll: ->
      reenableAll: ->
    @snippetWasDropped =
      fire: ->
    @blurFocusedElement = ->


  startDrag: ({ componentModel, snippetView, event, config }) ->
    return unless componentModel || snippetView
    componentModel = snippetView.model if snippetView

    snippetDrag = new SnippetDrag
      componentModel: componentModel
      snippetView: snippetView

    config ?=
      longpress:
        showIndicator: true
        delay: 400
        tolerance: 3

    @dragBase.init(snippetDrag, event, config)


  setWindow: ->
    @window = window
    @document = @window.document
    @$document = $(@document)
    @$body = $(@document.body)



