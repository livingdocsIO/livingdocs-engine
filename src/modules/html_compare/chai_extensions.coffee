htmlCompare = require('./html_compare')
_ = require('underscore')

error = undefined

# Chai helpers
chai.use (_chai, utils) ->

  # Use: expect(obj).to.have.same.html(expected)
  chai.Assertion.addMethod 'html', (expected) ->
    assertion = new chai.Assertion(@_obj)
    error = undefined
    result = htmlCompare.compare(@_obj, expected)
    preamble = "Expected to have the same HTML:\n"
    error ?= """
    A: #{ outerHtml(@_obj) }
    B: #{ outerHtml(expected) }
    """

    assertion.assert result,
      preamble + error,
      "Expected not to have the same HTML:\n#{ outerHtml(@_obj) }",
      expected



# Setup htmlCompare error messages
# --------------------------------
outerHtml = (obj) ->
  str = if not obj?
    ''
  else if typeof obj == 'string'
    obj
  else
    obj = obj[0] if obj.jquery
    obj.outerHTML

  $.trim(str).replace(/\s+/g, ' ')


printNode = (node) ->
  return '[does not exist]' unless node?

  switch node.nodeType
    when 1 then printElement(node)
    when 3 then node.nodeValue
    else
      node.nodeType


printElement = (elem) ->
  str = "<#{ elem.nodeName.toLowerCase() }"
  attributes = _.sortBy(elem.attributes, (attr) -> attr.name)
  for attr in attributes
    str += " #{ attr.name }=\"#{ attr.value }\""
  str += ">"


wrap = (name, callback) ->
  func = htmlCompare[name]
  htmlCompare[name] = ->
    result = func.apply(htmlCompare, arguments)
    callback.apply(undefined, arguments) if not result
    result


wrap 'bothExist', (a, b) ->
  error ?= """
  Discovered different node count:
  Node A: #{ printNode(a) }
  Node B: #{ printNode(b) }
  """

wrap 'bothAreOfSameNodeType', (a, b) ->
  error ?= """
  Discovered nodes of different nodeType:
  Node A: #{ printNode(a) }
  Node B: #{ printNode(b) }
  """

wrap 'compareElement', (a, b) ->
  error ?= """
  Elem A: #{ printElement(a) }
  Elem B: #{ printElement(b) }
  """

wrap 'compareText', (a, b) ->
  error ?= """
  Text A: #{ a.nodeValue }
  Text B: #{ b.nodeValue }
  """

