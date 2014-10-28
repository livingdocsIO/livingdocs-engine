log = require('../modules/logging/log')
assert = require('../modules/logging/assert')
words = require('../modules/words')
config = require('../configuration/config')

DirectiveIterator = require('./directive_iterator')
DirectiveCollection = require('./directive_collection')
directiveCompiler = require('./directive_compiler')
directiveFinder = require('./directive_finder')

SnippetModel = require('../snippet_tree/snippet_model')
SnippetView = require('../rendering/snippet_view')

sortByName = (a, b) ->
  if (a.name > b.name)
    1
  else if (a.name < b.name)
    -1
  else
    0

# Template
# --------
# Parses snippet templates and creates SnippetModels and SnippetViews.
module.exports = class Template


  constructor: ({ html, @namespace, @id, identifier, title, properties } = {}) ->
    assert html, 'Template: param html missing'

    if identifier
      { @namespace, @id } = Template.parseIdentifier(identifier)

    @identifier = if @namespace && @id
      "#{ @namespace }.#{ @id }"

    @$template = $( @pruneHtml(html) ).wrap('<div>')
    @$wrap = @$template.parent()

    @title = title || words.humanize( @id )
    @styles = properties || {}
    @defaults = {}

    @parseTemplate()


  setDesign: (design) ->
    @design = design
    @namespace = design.name
    @identifier = "#{ @namespace }.#{ @id }"


  # create a new SnippetModel instance from this template
  createModel: () ->
    new SnippetModel(template: this)


  createView: (snippetModel, isReadOnly) ->
    snippetModel ||= @createModel()
    $elem = @$template.clone()
    directives = @linkDirectives($elem[0])

    snippetView = new SnippetView
      model: snippetModel
      $html: $elem
      directives: directives
      isReadOnly: isReadOnly


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
        when 'html'
          @formatHtml(directive.name, directive.elem)


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
    $elem.addClass(config.css.editable)

    defaultValue = words.trim(elem.innerHTML)
    @defaults[name] = if defaultValue then defaultValue else ''
    elem.innerHTML = ''


  formatContainer: (name, elem) ->
    # remove all content fron a container from the template
    elem.innerHTML = ''


  formatHtml: (name, elem) ->
    defaultValue = words.trim(elem.innerHTML)
    @defaults[name] = defaultValue if defaultValue
    elem.innerHTML = ''


  # Return an object describing the interface of this template
  # @returns { Object } An object wich contains the interface description
  #   of this template. This object will be the same if the interface does
  #   not change since directives and properties are sorted.
  info: () ->
    doc =
      name: @id
      design: @namespace
      directives: []
      properties: []

    @directives.each (directive) =>
      { name, type } = directive
      doc.directives.push({ name, type })


    for name, style of @styles
      doc.properties.push({ name, type: 'cssModificator' })

    doc.directives.sort(sortByName)
    doc.properties.sort(sortByName)
    doc



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
