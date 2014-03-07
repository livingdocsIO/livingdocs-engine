htmlCompare = require('./html_compare')
$ = require('jquery')

# Accepts:
# - undefined
# - string
# - DOM node
# - jquery element
#
# @return: always a string
outerHtml = (obj) ->
  if not obj?
    ''
  else if typeof obj == 'string'
    obj
  else
    obj = $(obj) if !obj.jquery
    obj.outerHtml()


toEqualHtmlOf = (expected) ->
  notText = if @isNot then ' not' else ''

  actualHtml = outerHtml(@actual)
  expectedlHtml = outerHtml(expected)
  @message = ->
    "#{ actualHtml } \n#{ notText } should have equal html as \n#{ expectedlHtml }"

  htmlCompare.compare(@actual, expected)


# Add jasmine helper
beforeEach ->
  this.addMatchers(toEqualHtmlOf: toEqualHtmlOf)
