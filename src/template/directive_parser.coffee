directiveParser = do ->

  attributePrefix = /^(x-|data-)/

  parse: (elem) ->
    elemDirective = undefined
    modifications = []
    @parseDirectives elem, (directive) ->
      if directive.isElementDirective()
        elemDirective = directive
      else
        modifications.push(directive)

    if elemDirective
      elemDirective.modifications = modifications

    return elemDirective


  parseDirectives: (elem, func) ->
    directiveData = []
    for attr in elem.attributes
      attributeName = attr.name
      normalizedName = attributeName.replace(attributePrefix, '')
      if type = templateAttrLookup[normalizedName]
        directiveData.push
          attributeName: attributeName
          directive: new Directive
            name: attr.value
            type: type
            elem: elem

    # Since we modify the attributes we have to split
    # this into two loops
    for data in directiveData
      directive = data.directive
      @rewriteAttribute(directive, data.attributeName)
      func(directive)


  # Normalize or remove the attribute
  # depending on the directive type.
  rewriteAttribute: (directive, attributeName) ->
    if directive.isElementDirective()
      if attributeName != directive.renderedAttr()
        @normalizeAttribute(directive, attributeName)
      else if not directive.name
        @normalizeAttribute(directive)
    else
      @removeAttribute(directive, attributeName)


  # force attribute style as specified in config
  # e.g. attribute 'doc-container' becomes 'data-doc-container'
  normalizeAttribute: (directive, attributeName) ->
    elem = directive.elem
    if attributeName
      @removeAttribute(directive, attributeName)
    elem.setAttribute(directive.renderedAttr(), directive.name)


  removeAttribute: (directive, attributeName) ->
    directive.elem.removeAttribute(attributeName)

