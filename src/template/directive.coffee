class Directive

  constructor: ({ name, @type, @elem }) ->
    @name = name || config.directives[@type].defaultName
    @config = config.directives[@type]


  renderedAttr: ->
    @config.renderedAttr


  isElementDirective: ->
    @config.elementDirective


  # For every new SnippetView the directives are cloned from the
  # template and linked with the elements from the new view
  clone: ->
    newDirective = new Directive(name: @name, type: @type)
    newDirective.optional = @optional
    newDirective
