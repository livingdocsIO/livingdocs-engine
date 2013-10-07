jsonHelper = do ->

  isEmpty: (obj) ->
    return true unless obj?
    for name of obj
      return false if obj.hasOwnProperty(name)

    true


  flatCopy: (obj) ->
    copy = undefined

    for name, value of obj
      copy ||= {}
      copy[name] = value

    copy
