eventing = do ->

  # Add an event listener to a $.Callbacks object that will
  # remove itself from its $.Callbacks after the first call.
  callOnce: (callbacks, listener) ->
    selfRemovingFunc = (args...) ->
      callbacks.remove(selfRemovingFunc)
      listener.apply(this, args)

    callbacks.add(selfRemovingFunc)
    selfRemovingFunc
