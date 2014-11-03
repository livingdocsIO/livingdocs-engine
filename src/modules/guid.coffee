module.exports = do ->

  idCounter = lastId = undefined

  # Generate a unique id.
  # Guarantees a unique id in this runtime.
  # Across runtimes its likely but not guaranteed to be unique
  # Use the user prefix to almost guarantee uniqueness,
  # assuming the same user cannot generate components in
  # multiple runtimes at the same time (and that clocks are in sync)
  next: (user = 'doc') ->

    # generate 9-digit timestamp
    nextId = Date.now().toString(32)

    # add counter if multiple trees need ids in the same millisecond
    if lastId == nextId
      idCounter += 1
    else
      idCounter = 0
      lastId = nextId

    "#{ user }-#{ nextId }#{ idCounter }"
