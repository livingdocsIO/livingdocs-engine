config = require('../configuration/config')

module.exports = directiveFinder = do ->

  prefixes = /^(x-|data-)/

  # Link a directive with its DOM node
  link: (elem, directiveCollection) ->
    @eachDirective elem, (type, name) ->
      directive = directiveCollection.get(name)
      directive.elem = elem


  # Find each directive that is defined on an element.
  # Normalizes the attribute names so that 'doc-editable',
  # 'data-doc-editable' and 'x-doc-editable' all work the same.
  eachDirective: (elem, callback) ->
    for attr in elem.attributes
      attrName = attr.name
      normalizedName = attrName.replace(prefixes, '')
      if type = config.templateAttrLookup[normalizedName]
        callback(type, attr.value, attrName)

    undefined

