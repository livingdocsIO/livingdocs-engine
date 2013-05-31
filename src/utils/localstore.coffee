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


  # HELPERS
  storePosition: (key, $node) ->
    @set("#{ key }-position", { top: $node.css("top"), left: $node.css("left") })


  restorePosition: (key, $node) ->
    offset = @get("#{ key }-position")
    $node.css({ left:"#{ offset.left }", top:"#{ offset.top }" }) if offset
