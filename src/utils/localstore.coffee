# Access to localstorage
# ----------------------
# Simplified version of [https://github.com/marcuswestin/store.js]()
localstore = ( (win) ->

  available = undefined
  storageName = 'localStorage'
  storage = win[storageName]


  set: (key, value) ->
    return @remove(key) unless value?
    storage.setItem(key, @serialize(value))
    value


  get: (key) ->
    @deserialize(storage.getItem(key))


  remove: (key) ->
    storage.removeItem(key)


  clear: ->
    storage.clear()


  isSupported: ->
    return available if available?
    available = @detectLocalstore()


  # Internal
  # --------

  serialize: (value) ->
    JSON.stringify(value)


  deserialize: (value) ->
    return undefined if typeof value != 'string'
    try
      JSON.parse(value)
    catch error
      value || undefined


  detectLocalstore: ->
    return false unless win[storageName]?
    testKey = '__localstore-feature-detection__'
    try
      @set(testKey, testKey)
      retrievedValue = @get(testKey)
      @remove(testKey)
      retrievedValue == testKey
    catch error
      false


)(this)
