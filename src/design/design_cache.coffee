assert = require('../modules/logging/assert')
Design = require('./design')

module.exports = do ->

  designs: {}

  add: (design) ->
    name = design.namespace
    @designs[name] = design


  has: (name) ->
    @designs[name]?


  get: (name) ->
    assert @has(name), "Error: design '#{ name }' is not loaded."
    @designs[name]


  # @param: design name as string or a designConfiguration object.
  load: (name) ->
    if typeof name == 'string'
      assert false, 'Load design by name is not implemented yet.'
    else
      designConfig = name
      design = new Design(designConfig)
      @add(design)

