describe 'Title Template', ->

  template = undefined
  beforeEach ->
    template = new Template
      id: 'h1'
      html: """<h1 #{ docAttr.editable }="title"></h1>"""


  it 'has $template Property', ->
    expect(template.$template).toBeDefined()


  it 'has an id', ->
    expect(template.id).toEqual('h1')


  it 'has one directive', ->
    expect(template.directives.length).toEqual(1)


  it 'has stored the html', ->
    expected =
      "<h1 #{ docAttr.editable }='title' class='#{ docClass.editable }'></h1>"
    expect( htmlCompare.compare(template.$template, expected) ).toBe(true)


  describe '#createModel()', ->

    it 'returns a SnippetModel', ->
      model = template.createModel()
      expect(model instanceof SnippetModel).toBe(true)


  describe '#createView()', ->

    it 'returns a SnippetView instance', ->
      snippetView = template.createView()
      expect(snippetView instanceof SnippetView).toBe(true)



describe 'Dropdown Template', ->

  template = null
  beforeEach ->
    template = new Template
      id: 'dropdown'
      html:
        """
        <div>
          <a class='btn btn-primary dropdown-toggle' data-toggle='dropdown' href='#'>
            <i class='icon-plus icon-white'></i>
          </a>
          <ul class='dropdown-menu' #{ docAttr.list }="links">
            <li>
              <a href='#' #{ docAttr.editable }="dropdownLink"></a>
            </li>
          </ul>
        </div>
        """


  it 'has stored the html', ->
    $template = template.$template
    expect($template.findIn('div').length).toEqual(1)
    expect($template.findIn('a').length).toEqual(1)
    expect($template.findIn('i').length).toEqual(1)
    expect($template.findIn('ul').length).toEqual(1)

    # the <li> element should have been cut out and stored in a list item template
    expect($template.findIn('li').length).toEqual(0)


  it 'has a list called links', ->
    expect(template.list('links').name).toEqual('links')


  it 'returns a snippet', ->
    snippet = template.createModel()
    expect(snippet instanceof SnippetModel).toBe(true)


describe 'Template.parseIdentifier()', ->

  it 'parses "bootstrap.title"', ->
    identifier = Template.parseIdentifier('bootstrap.title')
    expect(identifier.namespace).toEqual('bootstrap')
    expect(identifier.id).toEqual('title')


  it 'does not parse "bootstrap"', ->
    identifier = Template.parseIdentifier('title')
    expect(identifier.namespace).toBeUndefined()
    expect(identifier.id).toEqual('title')


  it 'does not parse emtpy string', ->
    identifier = Template.parseIdentifier('')
    expect(identifier).toBeUndefined()


  it 'does not parse undefined', ->
    identifier = Template.parseIdentifier()
    expect(identifier).toBeUndefined()


describe 'Template with default value', ->

  it 'trims the default value', ->
    template = new Template
      identifier: 'bootstrap.title'
      html: """<h1 #{ docAttr.editable }="title">\n\t your title\t </h1>"""

    expect(template.defaults['title']).toEqual('your title')


describe 'new Template()', ->

  it 'accepts idenfitier param', ->
    template = new Template
      identifier: 'bootstrap.title'
      html: """<h1 #{ docAttr.editable }="title"></h1>"""

    expect(template.namespace).toEqual('bootstrap')
    expect(template.id).toEqual('title')


# Snippet with snippet containers
describe 'Row Template', ->

  template = null
  beforeEach ->
    template = test.getTemplate('row')


  it 'initializes SnippetContainers', ->
    snippet = template.createModel()
    expect(snippet).toBeDefined()
    expect(snippet.containers.main instanceof SnippetContainer).toBe(true)
    expect(snippet.containers.sidebar instanceof SnippetContainer).toBe(true)


describe 'Subtitle Template', ->

  it 'has a default value', ->
    subtitle = test.getTemplate('subtitle')
    expect(subtitle.defaults['title']).toEqual('Who\'s your Caddy?')


  it 'leaves the default value in the template', ->
    subtitle = test.getTemplate('subtitle')
    expect(subtitle.$template[0].innerHTML).toEqual('Who\'s your Caddy?')


describe 'Container', ->

 it 'creates a default container', ->
    container = test.getTemplate('container')
    expect(container.directives.all.hasOwnProperty('default')).toBe(true)


describe 'Stuffed Container', ->

  it 'removes container content from $template', ->
    stuffedContainer = test.getTemplate('stuffedContainer')
    $container = stuffedContainer.$template.find('.container')
    expect($container.length).toEqual(1)
    expect($container.html()).toEqual('')


describe 'Html Template', ->

  template = null
  beforeEach ->
    template = test.getTemplate('html')

  it 'has a html directive', ->
    directive = template.directives.html[0]
    expect(directive).toBeDefined()

