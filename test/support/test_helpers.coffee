config = require('../../src/configuration/defaults')
$ = require('../../components/jquery/jquery')

module.exports = testHelpers =

  $: $
  jQuery: $

  createElem: (str) ->
    $(str)[0]


# Add properties to testHelpers
#
# add a Attr property for every directive
# e.g. testHelpers.containerAttr = 'doc-container'
for directiveName, obj of config.directives
  testHelpers["#{ directiveName }Attr"] = obj.renderedAttr
