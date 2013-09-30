directiveParser = do ->

  attributePrefix = /^(x-|data-)/

  parse: (elem) ->
    elemDirective = undefined
    @parseDirectives elem, (directive) ->
      if directive.isElementDirective()
        elemDirective = directive

    return elemDirective


  parseDirectives: (elem, func) ->
    for attr in elem.attributes
      attributeName = attr.name
      normalizedName = attributeName.replace(attributePrefix, '')
      if type = templateAttrLookup[normalizedName]
        directive = new Directive
          name: attr.value
          type: type
          elem: elem

        if directive.isElementDirective()
          if attributeName != directive.renderedAttr()
            @normalizeAttribute(directive, attributeName)
          else if not attr.value
            @normalizeAttribute(directive)
        else
          @removeAttribute(directive, attributeName)

        func(directive)


  # force attribute style as specified in config
  # e.g. attribute 'doc-container' becomes 'data-doc-container'
  normalizeAttribute: (directive, attributeName) ->
    elem = directive.elem
    if attributeName
      @removeAttribute(directive, attributeName)
    elem.setAttribute(directive.renderedAttr(), directive.name)


  removeAttribute: (directive, attributeName) ->
    directive.elem.removeAttribute(attributeName)

