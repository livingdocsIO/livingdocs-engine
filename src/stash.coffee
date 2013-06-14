stash = do ->
  initialized = false


  init: ->
    if not initialized
      initialized = true

      # store up to ten versions
      @store = new LimitedLocalstore('stash', 10)


  snapshot: ->
    @store.push(document.toJson())


  stash: ->
    @snapshot()
    document.reset()


  delete: ->
    @store.pop()


  get: ->
    @store.get()


  restore: ->
    json = @store.get()

    if json
      document.restore(json)
    else
      error('stash is empty')


  list: ->
    @store.getIndex()
