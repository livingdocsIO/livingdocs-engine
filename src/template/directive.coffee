class Directive

  constructor: ({ name, @type, @elem }) ->
    @name = name || templateAttr.defaultValues[@type]
