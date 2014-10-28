assert = require('../modules/logging/assert')
Design = require('./design')

module.exports = do ->

  designs: {}

  # Can load a design synchronously if you include the
  # design.js file before livingdocs.
  # doc.design.load(designs['nameOfYourDesign'])
  #
  # Proposed extensions:
  # Will be extended to load designs remotely from a server:
  # Load from a remote server by name (server has to be configured as default)
  # doc.design.load('ghibli')
  #
  # Load from a custom server:
  # doc.design.load('http://yourserver.io/designs/ghibli/design.json')
  load: (designSpec) ->
    if typeof designSpec == 'string'
      assert false, 'Load design by name is not implemented yet.'
    else
      return if @has(designSpec.design?.name)
      design = Design.parser.parse(designSpec)
      if design
        @add(design)
      else
        throw new Error(Design.parser.errors)


  # Add an already parsed design.
  # @param { Design object }
  add: (design) ->
    @designs[design.name] = design


  # Check if a design is loaded
  has: (name) ->
    @designs[name]?


  # Get a loaded design
  # @return { Design object }
  get: (name) ->
    assert @has(name), "Error: design '#{ name }' is not loaded."
    @designs[name]


  # Clear the cache if you want to reload designs
  resetCache: ->
    @designs = {}

