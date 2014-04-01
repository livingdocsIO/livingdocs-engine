# @return proxy function that always returns this
chainable = (func) ->
  ->
    func.apply(this, arguments)
    this


# create a property on the obj that represents
# $.Callbacks.add. The callback can be fired with obj.property.fire(...)
chainableListener = () ->
  callbacks = $.Callbacks()
  func = chainable(callbacks.add)
  func.fire = callbacks.fire
  func


class Editable

  constructor: ->

  focus: chainableListener()
  blur: chainableListener()
  insert: chainableListener()
  merge: chainableListener()
  split: chainableListener()
  selection: chainableListener()
  newline: chainableListener()

window.Editable = Editable


