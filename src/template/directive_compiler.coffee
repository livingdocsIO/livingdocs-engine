config = require('../configuration/config')
Directive = require('./directive')
directiveFinder = require('./directive_finder')
assert = require('../modules/logging/assert')
_ = require('underscore')

module.exports = do ->


  parse: (elem) ->
    directives = []
    modifications = []
    overwritesContent = false
    @eachDirective elem, (directive) ->
      if directive.isModification()
        modifications.push(directive)
      else
        if directive.overwritesContent()
          assert not overwritesContent, "Incompatible directives declared on element (#{ directive.type } directive '#{ directive.name }')"
          overwritesContent = true
        directives.push(directive)

    @applyModifications(directives, modifications) if directives.length
    return directives


  eachDirective: (elem, func) ->
    directiveData = []
    directiveFinder.eachDirective elem, (type, name, attributeName) =>
      directiveData.push
        attributeName: attributeName
        directive: new Directive({ name, type, elem })

    # Since we modify the attributes we have to split
    # this into two loops
    for data in directiveData
      directive = data.directive
      @rewriteAttribute(directive, data.attributeName)
      func(directive)


  applyModifications: (directives, modifications) ->
    for modification in modifications
      if modification.type == 'optional'
        for directive in directives
          if _.contains(modification.config.modifies, directive.type)
            directive.optional = true


  # Rewrite Attributes
  # - Normalize directive attributes
  # - Remove modification attributes
  rewriteAttribute: (directive, attributeName) ->
    if directive.isModification()
      @removeAttribute(directive, attributeName)
    else
      if attributeName != directive.renderedAttr()
        @normalizeAttribute(directive, attributeName)
      else if not directive.name
        @normalizeAttribute(directive)


  # force attribute style as specified in config
  # e.g. attribute 'doc-container' becomes 'data-doc-container'
  normalizeAttribute: (directive, attributeName) ->
    elem = directive.elem
    if attributeName
      @removeAttribute(directive, attributeName)
    elem.setAttribute(directive.renderedAttr(), directive.name)


  removeAttribute: (directive, attributeName) ->
    directive.elem.removeAttribute(attributeName)

