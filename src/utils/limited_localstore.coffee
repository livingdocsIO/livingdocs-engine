class LimitedLocalstore

  constructor: (@key, @limit) ->
    @limit ||= 10
    @index = undefined


  push: (obj) ->
    reference =
      key: @nextKey()
      date: Date.now()

    index = @getIndex()
    index.push(reference)

    if index.length > @limit
      index.splice(0, index.length - @limit)

    localstore.set(reference.key, obj)
    localstore.set("#{ @key }-index", index)


  pop: ->
    index = @getIndex()
    if index && index.length
      reference = index.pop()
      value = localstore.get(reference.key)
      localstore.remove(reference.key)
      @setIndex()
      value
    else
      undefined


  get: (num) ->
    index = @getIndex()
    if index && index.length
      num ||= index.length - 1
      reference = index[num]
      value = localstore.get(reference.key)
    else
      undefined


  clear: ->
    index = @getIndex()
    while reference = index.pop()
      localstore.remove(reference.key)

    @setIndex()


  getIndex: ->
    @index ||= localstore.get("#{ @key }-index") || []
    @index


  setIndex: ->
    if @index
      localstore.set("#{ @key }-index", @index)


  nextKey: ->
    # just a random key
    addendum = Math.floor(Math.random() * 1e16).toString(32)
    "#{ @key }-#{ addendum }"






