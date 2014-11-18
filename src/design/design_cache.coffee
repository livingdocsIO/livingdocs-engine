assert = require('../modules/logging/assert')
Design = require('./design')
designParser = require('./design_parser')
Version = require('./version')

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
    assert designSpec?, 'design.load() was called with undefined.'
    assert not (typeof designSpec == 'string'), 'design.load() loading a design by name is not implemented.'

    version = Version.parse(designSpec.version)
    designIdentifier = Design.getIdentifier(designSpec.name, version)
    return if @has(designIdentifier)

    design = designParser.parse(designSpec)
    if design
      @add(design)
    else
      throw new Error(Design.parser.errors)


  # Add an already parsed design.
  # @param { Design object }
  add: (design) ->
    if design.isNewerThan(@designs[design.name])
      @designs[design.name] = design
    @designs[design.identifier] = design


  # Check if a design is loaded
  has: (designIdentifier) ->
    @designs[designIdentifier]?


  # Get a loaded design
  # @return { Design object }
  get: (designIdentifier) ->
    assert @has(designIdentifier), "Error: design '#{ designIdentifier }' is not loaded."
    @designs[designIdentifier]


  # Clear the cache if you want to reload designs
  resetCache: ->
    @designs = {}

