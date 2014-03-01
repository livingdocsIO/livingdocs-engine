config = require('../../src/configuration/defaults')
$ = require('../../components/jquery/jquery')
Design = require('../../src/design/design')
testDesign = require('./test_design')

# Local variables
cachedDesign = undefined


# Export testHelpers
module.exports = testHelpers =

  $: $
  jQuery: $

  createElem: (str) ->
    $(str)[0]


  getDesign: () ->
    cachedDesign ||= new Design(testDesign)


  getTemplate: (id) ->
    @getDesign().get(id)


# Add properties to testHelpers
#
# add a Attr property for every directive
# e.g. testHelpers.containerAttr = 'doc-container'
for directiveName, obj of config.directives
  testHelpers["#{ directiveName }Attr"] = obj.renderedAttr
