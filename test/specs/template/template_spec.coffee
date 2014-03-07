Template = require('../../../src/template/template')
SnippetModel = require('../../../src/snippet_tree/snippet_model')
SnippetContainer = require('../../../src/snippet_tree/snippet_container')
SnippetView = require('../../../src/rendering/snippet_view')

describe 'Title Template', ->

  template = undefined
  beforeEach ->
    template = new Template
      id: 'h1'
      html: """<h1 #{ test.editableAttr }="title"></h1>"""


  it 'has $template Property', ->
    expect(template.$template).to.exist


  it 'has an id', ->
    expect(template.id).to.equal('h1')


  it 'has one directive', ->
    expect(template.directives.length).to.equal(1)


  it 'has stored the html', ->
    expect(template.$template).to.have.same.html """
      <h1 #{ test.editableAttr }='title' class='#{ docClass.editable }'>
      </h1>"""


  describe '#createModel()', ->

    it 'returns a SnippetModel', ->
      model = template.createModel()
      expect(model instanceof SnippetModel).to.equal(true)


  describe '#createView()', ->

    it 'returns a SnippetView instance', ->
      snippetView = template.createView()
      expect(snippetView instanceof SnippetView).to.equal(true)


describe 'Template.parseIdentifier()', ->

  it 'parses "bootstrap.title"', ->
    identifier = Template.parseIdentifier('bootstrap.title')
    expect(identifier.namespace).to.equal('bootstrap')
    expect(identifier.id).to.equal('title')


  it 'does not parse "bootstrap"', ->
    identifier = Template.parseIdentifier('title')
    expect(identifier.namespace).to.be.undefined
    expect(identifier.id).to.equal('title')


  it 'does not parse emtpy string', ->
    identifier = Template.parseIdentifier('')
    expect(identifier).to.be.undefined


  it 'does not parse undefined', ->
    identifier = Template.parseIdentifier()
    expect(identifier).to.be.undefined


describe 'Template with default value', ->

  it 'trims the default value', ->
    template = new Template
      identifier: 'bootstrap.title'
      html: """<h1 #{ test.editableAttr }="title">\n\t your title\t </h1>"""

    expect(template.defaults['title']).to.equal('your title')


describe 'new Template()', ->

  it 'accepts idenfitier param', ->
    template = new Template
      identifier: 'bootstrap.title'
      html: """<h1 #{ test.editableAttr }="title"></h1>"""

    expect(template.namespace).to.equal('bootstrap')
    expect(template.id).to.equal('title')


# Snippet with snippet containers
describe 'Row Template', ->

  template = null
  beforeEach ->
    template = test.getTemplate('row')


  it 'initializes SnippetContainers', ->
    snippet = template.createModel()
    expect(snippet).to.exist
    expect(snippet.containers.main instanceof SnippetContainer).to.equal(true)
    expect(snippet.containers.sidebar instanceof SnippetContainer).to.equal(true)


describe 'Subtitle Template', ->

  it 'has a default value', ->
    subtitle = test.getTemplate('subtitle')
    expect(subtitle.defaults['title']).to.equal('Who\'s your Caddy?')


  it 'removes the default value from the template', ->
    subtitle = test.getTemplate('subtitle')
    expect(subtitle.$template[0].innerHTML).to.equal('')


describe 'Container', ->

 it 'creates a default container', ->
    container = test.getTemplate('container')
    expect(container.directives.all.hasOwnProperty('default')).to.equal(true)


describe 'Stuffed Container', ->

  it 'removes container content from $template', ->
    stuffedContainer = test.getTemplate('stuffedContainer')
    $container = stuffedContainer.$template.find('.container')
    expect($container.length).to.equal(1)
    expect($container.html()).to.equal('')


describe 'Html Template', ->

  template = null
  beforeEach ->
    template = test.getTemplate('html')

  it 'has a html directive', ->
    directive = template.directives.html[0]
    expect(directive).to.exist

