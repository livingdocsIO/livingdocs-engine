config = require('../configuration/config')
css = config.css
DragBase = require('../interaction/drag_base')
ComponentDrag = require('../interaction/component_drag')

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


  startDrag: ({ componentModel, componentView, event, config }) ->
    return unless componentModel || componentView
    componentModel = componentView.model if componentView

    componentDrag = new ComponentDrag
      componentModel: componentModel
      componentView: componentView

    config ?=
      longpress:
        showIndicator: true
        delay: 400
        tolerance: 3

    @dragBase.init(componentDrag, event, config)


  setWindow: ->
    @window = window
    @document = @window.document
    @$document = $(@document)
    @$body = $(@document.body)



