module.exports = class Transforms

  constructor: (@templates) ->


  getTransformations: ({ template, componentName, oneWay, directives, filter }) ->
    template = @templates.get(componentName) if componentName

    oneWay ?= false
    options = []
    @templates.each (other) =>
      return if template.equals(other)
      return if filter? && not filter(other)

      compatibility = @isCompatible(template, other, { oneWay, directives })

      if compatibility.isCompatible
        compatibility.template = other
        options.push(compatibility)

    return if options.length then options else undefined


  # @return {Array of { label, componentName }} Array of component names
  getOptionsList: ({ template, componentName, oneWay, directives, filter }) ->
    template = @templates.get(componentName) if componentName
    options = @getTransformations({ template, oneWay, directives, filter })

    names = []
    for option in options || []
      componentName = option.name
      template = option.template
      names.push(label: template.label, componentName: componentName)

    names


  # Check if a template can be transformed into another
  # template.
  # and ignore everything else.
  # @param {Template} First Template
  # @param {Template} Second Template
  # @param {Object}
  #  - oneWay {Boolean}: Also return components that can only be transformed in one direction.
  #  - directives {Array of String}: The directives of a to export into b (will set the oneWay flag).
  isCompatible: (a, b, options={}) ->
    obj =
      name: b.name
      isCompatible: true
      mapping: {}

    directives = if options.directives?
      options.oneWay = true
      for name in options.directives
        a.directives.get(name)
    else
      a.directives

    for directive in directives || []
      { name, type } = directive

      # only allow selected directive types to be transformed
      unless type in ['editable', 'image', 'link']
        obj.isCompatible = false
        continue

      # is there only one directive of this type?
      if a.directives.count(type) == 1 && b.directives.count(type) == 1
        obj.mapping[name] = b.directives[type][0].name
      # has the other a directive with the same name and type?
      else if b.directives.get(name)?.type == type
        obj.mapping[name] = name
      else
        obj.mapping[name] = null
        obj.isCompatible = false

    if not options.oneWay
      obj.isCompatible = false if a.directives.length != b.directives.length

    return obj

