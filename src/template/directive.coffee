class Directive

  constructor: ({ name, @type, @elem }) ->
    @name = name || templateAttr.defaultValues[@type]
    @config = config.directives[@type]


  renderedAttr: ->
    @config.renderedAttr


  isElementDirective: ->
    @config.elementDirective
