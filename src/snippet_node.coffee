class SnippetNode


  constructor: (@htmlNode) ->
    @extractData()


  # @private
  extractData: ->
    for type, attribute of docAttr
      if @htmlNode.hasAttribute(attribute)
        @type = type
        @isDataNode = true
        @name = @htmlNode.getAttribute(attribute) || 'default'
        break
