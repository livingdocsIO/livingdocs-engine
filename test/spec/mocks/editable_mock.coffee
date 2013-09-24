# mock EditableJS
Editable = do ->

  init: ->
    test.chainableListener(this, 'focus')
    test.chainableListener(this, 'blur')
    test.chainableListener(this, 'insert')
    test.chainableListener(this, 'merge')
    test.chainableListener(this, 'split')
    test.chainableListener(this, 'selection')
    test.chainableListener(this, 'newline')

    @add = ->
    @remove = ->
