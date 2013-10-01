class Directive

  constructor: ({ name, @type, @elem }) ->
    @name = name || config.directives[@type].defaultName
    @config = config.directives[@type]


  renderedAttr: ->
    @config.renderedAttr


  isElementDirective: ->
    @config.elementDirective
