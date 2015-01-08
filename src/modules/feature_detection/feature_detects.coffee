$ = require('jquery')

module.exports = do ->

  htmlPointerEvents: ->
    element = $('<x>')[0]
    element.style.cssText = 'pointer-events:auto'
    return element.style.pointerEvents == 'auto'
