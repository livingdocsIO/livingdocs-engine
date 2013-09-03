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
# Templates are repeatable and can only be used inside their
# defining snippet.
class Template


  constructor: ({ html, @namespace, @name, identifier, title, version } = {}) ->
    if not html
      log.error('Template: param html missing')

    if identifier
      { @namespace, @name } = Template.parseIdentifier(identifier)

    @identifier = if @namespace && @name
      "#{ @namespace }.#{ @name }"

    @version = version || 1

    @$template = $( @pruneHtml(html) ).wrap('<div>')
    @$wrap = @$template.parent()
    @title = title || words.humanize( @name )
    @defaults = {}

    @parseTemplate()
    @lists = @createLists()


  # create a new SnippetModel instance from this template
  createModel: () ->
    new SnippetModel(template: this)


  createView: (snippetModel) ->
    snippetModel ||= @createModel()
    $elem = @$template.clone()
    directives = @getDirectives($elem[0])

    snippetView = new SnippetView
      model: snippetModel
      $html: $elem
      directives: directives
      editables: directives.editable
      containers: directives.container
      images: directives.image


  # todo
  pruneHtml: (html) ->
    # e.g. remove ids
    html


  parseTemplate: () ->
    elem = @$template[0]
    @directives = @getDirectives(elem)

    if editables = @directives.editable
      for directive in editables
        @formatEditable(directive.name, directive.elem)

    if containers = @directives.container
      for directive in containers
        @formatContainer(directive.name, directive.elem)


  # Find and store all DOM nodes which are editables or containers
  # in the html of a snippet or the html of a template.
  getDirectives: (elem) ->
    iterator = new SnippetNodeIterator(elem)
    directives = new DirectiveCollection()

    while elem = iterator.nextElement()
      directive = directiveParser.parse(elem)
      directives.add(directive) if directive

    directives


  formatEditable: (name, elem) ->
    $elem = $(elem)
    $elem.addClass(docClass.editable)

    defaultValue = elem.innerHTML
    # not sure how to deal with default values in editables...
    # elem.innerHTML = ''

    if defaultValue
      @defaults[name] = defaultValue


  formatContainer: (name, elem) ->
    # remove all content fron a container from the template
    elem.innerHTML = ''


  createLists: () ->
    lists = {}
    @$wrap.find("[#{ docAttr.list }]").each( ->
      $list = $(this)
      listName = $list.attr("#{ docAttr.list }")
      lists[listName] = new SnippetTemplateList(listName, $list)
    )
    lists


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
    { namespace: undefined, name: parts[0] }
  else if parts.length == 2
    { namespace: parts[0], name: parts[1] }
  else
    log.error("could not parse snippet template identifier: #{ identifier }")
    { namespace: undefined , name: undefined }


