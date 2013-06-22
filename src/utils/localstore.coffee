# Access to localstorage
# ----------------------
# wrapper for [https://github.com/marcuswestin/store.js]()
localstore = do ->
  $ = jQuery

  set: (key, value) ->
    store.set(key, value)


  get: (key) ->
    store.get(key)


  remove: (key) ->
    store.remove(key)


  clear: ->
    store.clear()


  disbled: ->
    store.disabled
