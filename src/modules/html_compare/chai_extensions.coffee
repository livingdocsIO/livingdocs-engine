htmlCompare = require('./html_compare')

# Chai helpers
chai.use (_chai, utils) ->

  # Use: expect(obj).to.have.same.html(expected)
  chai.Assertion.addMethod 'html', (expected) ->
    assertion = new chai.Assertion(@_obj)
    assertion.assert htmlCompare.compare(@_obj, expected),
      'expected #{this} to have the same html as: #{exp}',
      'expected #{this} not to have the same html as: #{exp}',
      expected
