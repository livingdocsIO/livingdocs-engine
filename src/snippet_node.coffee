class SnippetNode

  attributePrefix = /^(x-|data-)/

  constructor: (@htmlNode) ->
    @parseAttributes()


  parseAttributes: () ->
    for attr in @htmlNode.attributes
      attributeName = attr.name
      normalizedName = attributeName.replace(attributePrefix, '')
      if type = templateAttrLookup[normalizedName]
        @isDataNode = true
        @type = type
        @name = attr.value || templateAttr.defaultValues[@type]

        if attributeName != docAttr[@type]
          @normalizeAttribute(attributeName)
        else if not attr.value
          @normalizeAttribute()

        return


  normalizeAttribute: (attr) ->
    @htmlNode.removeAttribute(attr) if attr
    @htmlNode.setAttribute(docAttr[@type], @name)
