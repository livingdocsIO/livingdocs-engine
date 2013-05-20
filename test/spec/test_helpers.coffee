test =

  # wrapper for `'prop' in object`
  # since this does not exist in coffeescript.
  # You can use this function to check for properties in the prototype chain.
  hasProperty: (obj, expectedProperty) ->
    `expectedProperty in obj`


  getH1Template: ->
    new SnippetTemplate
      name: "h1"
      namespace: "test"
      html: """<h1 #{ docAttr.editable }="title"></h1>"""


  getH1Snippet: ->
    new Snippet(template: @getH1Template())
