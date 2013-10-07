directiveFinder = do ->

  attributePrefix = /^(x-|data-)/

  link: (elem, directiveCollection) ->
    for attr in elem.attributes
      normalizedName = attr.name.replace(attributePrefix, '')
      if type = templateAttrLookup[normalizedName]
        directive = directiveCollection.get(attr.value)
        directive.elem = elem

    undefined
