directiveParser = do ->

  attributePrefix = /^(x-|data-)/

  parse: (elem) ->
    directive = undefined
    for attr in elem.attributes
      attributeName = attr.name
      normalizedName = attributeName.replace(attributePrefix, '')
      if type = templateAttrLookup[normalizedName]
        directive = new Directive
          name: attr.value
          type: type
          elem: elem

        if attributeName != docAttr[type]
          @normalizeAttribute(directive, attributeName)
        else if not attr.value
          @normalizeAttribute(directive)

    return directive


  # force attribute style as specified in config
  # e.g. attribute 'doc-container' becomes 'data-doc-container'
  normalizeAttribute: (directive, attributeName) ->
    elem = directive.elem
    if attributeName
      elem.removeAttribute(attributeName)
    elem.setAttribute(docAttr[directive.type], directive.name)
