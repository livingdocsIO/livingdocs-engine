words = require('../modules/words')
assert = require('../modules/logging/assert')

module.exports = class ImageRatio

  ratioString = /(\d+)[\/:x](\d+)/

  constructor: ({ @name, label, ratio }) ->
    @label = label || words.humanize( @name )
    @ratio = @parseRatio(ratio)


  parseRatio: (ratio) ->
    if $.type(ratio) == 'string'
      res = ratioString.exec(ratio)
      ratio = Number(res[1]) / Number(res[2])

    assert $.type(ratio) == 'number', "Could not parse image ratio #{ ratio }"
    ratio
