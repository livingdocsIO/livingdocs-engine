assert = require('../modules/logging/assert')
Design = require('./design')
designParser = require('./design_parser')
Version = require('./version')

module.exports = do ->

  designs: {}

  # Load a design synchronously if you include the
  # design.js file before livingdocs.
  #
  # Example:
  # doc.design.load(design.boilerplate, { basePath: '/' });
  #
  # @param {Object} Design configuration.
  #   For details see: https://github.com/upfrontIO/livingdocs-design-boilerplate
  # @param {Object}
  #   basePath {String} A basePath to resolve relative URLs.
  #     Required if the design contains relative URLs.
  load: (designSpec, { basePath }={}) ->
    assert designSpec?, 'design.load() was called with undefined.'
    assert not (typeof designSpec == 'string'), 'design.load() loading a design by name is not implemented.'

    version = Version.parse(designSpec.version)
    designIdentifier = Design.getIdentifier(designSpec.name, version)
    return if @has(designIdentifier)

    # Add the base path to the designSpec if specified
    designSpec.assets.basePath = basePath if basePath? && designSpec.assets?

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

