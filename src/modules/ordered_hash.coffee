module.exports = class OrderedHash

  constructor: ->
    @obj = {}
    @length = 0


  push: (key, value) ->
    @obj[key] = value
    @[@length] = value
    @length += 1


  get: (key) ->
    @obj[key]


  each: (callback) ->
    for value in this
      callback(value)


  toArray: ->
    value for value in this

