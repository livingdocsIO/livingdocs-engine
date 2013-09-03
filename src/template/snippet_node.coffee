class SnippetNode

  attributePrefix = /^(x-|data-)/

  constructor: (@elem) ->
    @parseAttributes()


  parseAttributes: () ->
    for attr in @elem.attributes
      attributeName = attr.name
      normalizedName = attributeName.replace(attributePrefix, '')
      if type = templateAttrLookup[normalizedName]
        @isDirective = true
        @type = type
        @name = attr.value || templateAttr.defaultValues[@type]

        if attributeName != docAttr[@type]
          @normalizeAttribute(attributeName)
        else if not attr.value
          @normalizeAttribute()

        return


  # force attribute style as specified in config
  # e.g. attribute 'doc-container' becomes 'data-doc-container'
  normalizeAttribute: (attr) ->
    @elem.removeAttribute(attr) if attr
    @elem.setAttribute(docAttr[@type], @name)
