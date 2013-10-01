# Template
# --------
# Parses snippet templates and creates snippet html.
#
# __Methods:__
# @snippet() create new snippets with content
#
# Consider: allow tags to be optional. These tags can then be hidden by
# the user. The template needs to know where to reinsert the tag if it is
# reinserted again.
# Options could be to set `display:none` or to remove the element and
# leave a marker instead.
# (a comment or a script tag like ember does for example)
#
# Consider: Replace lists with inline Templates. Inline
# Templates are repeatable and can only be used inside their
# defining snippet.
class Template


  constructor: ({ html, @namespace, @id, identifier, title, styles, weight, version } = {}) ->
    assert html, 'Template: param html missing'

    if identifier
      { @namespace, @id } = Template.parseIdentifier(identifier)

    @identifier = if @namespace && @id
      "#{ @namespace }.#{ @id }"

    @version = version || 1
    @$template = $( @pruneHtml(html) ).wrap('<div>')
    @$wrap = @$template.parent()

    @title = title || words.humanize( @id )
    @styles = styles || {}
    @weight = weight
    @defaults = {}

    @parseTemplate()


  # create a new SnippetModel instance from this template
  createModel: () ->
    new SnippetModel(template: this)


  createView: (snippetModel) ->
    snippetModel ||= @createModel()
    $elem = @$template.clone()
    directives = @linkDirectives($elem[0])

    snippetView = new SnippetView
      model: snippetModel
      $html: $elem
      directives: directives


  pruneHtml: (html) ->

    # remove all comments
    html = $(html).filter (index) ->
      @nodeType !=8

    # only allow one root element
    assert html.length == 1, "Templates must contain one root element. The Template \"#{@identifier}\" contains #{ html.length }"

    html

  parseTemplate: () ->
    elem = @$template[0]
    @directives = @compileDirectives(elem)

    @directives.each (directive) =>
      switch directive.type
        when 'editable'
          @formatEditable(directive.name, directive.elem)
        when 'container'
          @formatContainer(directive.name, directive.elem)


  # In the html of the template find and store all DOM nodes
  # which are directives (e.g. editables or containers).
  compileDirectives: (elem) ->
    iterator = new DirectiveIterator(elem)
    directives = new DirectiveCollection()

    while elem = iterator.nextElement()
      directive = directiveCompiler.parse(elem)
      directives.add(directive) if directive

    directives


  # For every new SnippetView the directives are cloned
  # and linked with the elements from the new view.
  linkDirectives: (elem) ->
    iterator = new DirectiveIterator(elem)
    snippetDirectives = @directives.clone()

    while elem = iterator.nextElement()
      directiveFinder.link(elem, snippetDirectives)

    snippetDirectives


  formatEditable: (name, elem) ->
    $elem = $(elem)
    $elem.addClass(docClass.editable)


    defaultValue = words.trim(elem.innerHTML)
    elem.innerHTML = defaultValue

    # not sure how to deal with default values in editables...
    # elem.innerHTML = ''

    if defaultValue
      @defaults[name] = defaultValue


  formatContainer: (name, elem) ->
    # remove all content fron a container from the template
    elem.innerHTML = ''


  # alias to lists
  list: (listName) ->
    @lists[listName]


  # output the accepted content of the snippet
  # that can be passed to create
  # e.g: { title: "Itchy and Scratchy" }
  printDoc: () ->
    doc =
      identifier: @identifier
      # editables: Object.keys @editables if @editables
      # containers: Object.keys @containers if @containers

    words.readableJson(doc)


# Static functions
# ----------------

Template.parseIdentifier = (identifier) ->
  return unless identifier # silently fail on undefined or empty strings

  parts = identifier.split('.')
  if parts.length == 1
    { namespace: undefined, id: parts[0] }
  else if parts.length == 2
    { namespace: parts[0], id: parts[1] }
  else
    log.error("could not parse snippet template identifier: #{ identifier }")
