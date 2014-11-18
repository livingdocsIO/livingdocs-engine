_ = require('underscore')

chai.use (_chai, utils) ->

  # Use: expect({ one: true }).to.be.of.size(1)
  chai.Assertion.addMethod 'size', (expected) ->
    assertion = new chai.Assertion(@_obj)
    assertion.assert _.size(@_obj) == expected,
      'expected #{this} to have the size: #{exp}',
      'expected #{this} not to have the size: #{exp}',
      expected
