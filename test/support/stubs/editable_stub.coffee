# @return proxy function that always returns this
chainable = (func) ->
  ->
    func.apply(this, arguments)
    this


# create a property on the obj that represents
# $.Callbacks.add. The callback can be fired with obj.property.fire(...)
chainableListener = (obj, funcName) ->
  callbacks = $.Callbacks()
  obj[funcName] = chainable(callbacks.add)
  obj[funcName].fire = callbacks.fire


# Stub EditableJS
window.Editable = do ->

  init: ->
    chainableListener(this, 'focus')
    chainableListener(this, 'blur')
    chainableListener(this, 'insert')
    chainableListener(this, 'merge')
    chainableListener(this, 'split')
    chainableListener(this, 'selection')
    chainableListener(this, 'newline')

    @add = ->
    @remove = ->
