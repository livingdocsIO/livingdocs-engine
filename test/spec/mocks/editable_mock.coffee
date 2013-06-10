# mock EditableJS
Editable = do ->

  init: ->
    test.chainableListener(this, 'focus')
    test.chainableListener(this, 'blur')
    test.chainableListener(this, 'selection')

    @add = ->
    @remove = ->
