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


  # very primitive implementation that does NOT work when contents come
  # in a different order, e.g. {a: 1, b: 2} != {b: 2, a: 1}
  # a better solution is here: http://stackoverflow.com/questions/1068834/object-comparison-in-javascript
  deepEquals: (o1, o2) ->
    JSON.stringify(o1) == JSON.stringify(o2)
