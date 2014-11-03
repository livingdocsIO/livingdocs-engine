deepEqual = require('deep-equal')
config = require('../configuration/config')
guid = require('../modules/guid')
log = require('../modules/logging/log')
assert = require('../modules/logging/assert')
ComponentModel = require('./snippet_model')
serialization = require('../modules/serialization')

module.exports = do ->

  # Public Methods
  # --------------

  # Serialize a ComponentModel
  #
  # Extends the prototype of ComponentModel
  #
  # Example Result:
  # id: 'akk7hjuue2'
  # identifier: 'timeline.title'
  # content: { ... }
  # styles: { ... }
  # data: { ... }
  # containers: { ... }
  ComponentModel::toJson = (snippet) ->
    snippet ?= this

    json =
      id: snippet.id
      identifier: snippet.template.identifier

    unless serialization.isEmpty(snippet.content)
      json.content = serialization.flatCopy(snippet.content)

    unless serialization.isEmpty(snippet.styles)
      json.styles = serialization.flatCopy(snippet.styles)

    unless serialization.isEmpty(snippet.dataValues)
      json.data = $.extend(true, {}, snippet.dataValues)

    # create an array for every container
    for name of snippet.containers
      json.containers ||= {}
      json.containers[name] = []

    json


  fromJson: (json, design) ->
    template = design.get(json.component || json.identifier)

    assert template,
      "error while deserializing snippet: unknown template identifier '#{ json.identifier }'"

    model = new ComponentModel({ template, id: json.id })

    for name, value of json.content
      assert model.content.hasOwnProperty(name),
        "error while deserializing snippet: unknown content '#{ name }'"

      # Transform string into object: Backwards compatibility for old image values.
      if model.directives.get(name).type == 'image' && typeof value == 'string'
        model.content[name] =
          url: value
      else
        model.content[name] = value

    for styleName, value of json.styles
      model.setStyle(styleName, value)

    model.data(json.data) if json.data

    for containerName, snippetArray of json.containers
      assert model.containers.hasOwnProperty(containerName),
        "error while deserializing snippet: unknown container #{ containerName }"

      if snippetArray
        assert $.isArray(snippetArray),
          "error while deserializing snippet: container is not array #{ containerName }"
        for child in snippetArray
          model.append( containerName, @fromJson(child, design) )

    model

