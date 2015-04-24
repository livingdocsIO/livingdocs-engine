module.exports = class Transforms

  constructor: (@templates) ->


  getTransformations: ({ template, componentName, oneWay, directives }) ->
    template = @templates.get(componentName) if componentName

    oneWay ?= false
    options = []
    @templates.each (other) ->
      return if template.equals(other)

      compatibility = template.isCompatible(other, { oneWay, directives })

      if compatibility.isCompatible
        compatibility.template = other
        options.push(compatibility)

    return if options.length then options else undefined


  # @return {Array of { label, componentName }} Array of component names
  getOptionsList: ({ template, componentName, oneWay, directives, filter }) ->
    template = @templates.get(componentName) if componentName
    options = @getTransformations({ template, oneWay, directives })

    names = []
    for option in options || []
      componentName = option.name
      template = option.template
      if not filter? || filter(template)
        names.push(label: template.label, componentName: componentName)

    names

