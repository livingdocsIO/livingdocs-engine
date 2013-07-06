describe 'Title Template', ->

  template = undefined
  beforeEach ->
    template = new SnippetTemplate
      name: 'h1'
      html: """<h1 #{ docAttr.editable }="title"></h1>"""


  it 'has $template Property', ->
    expect(template.$template).toBeDefined()


  it 'has a name', ->
    expect(template.name).toEqual('h1')


  it 'has stored the html', ->
    expected =
      "<h1 #{ docAttr.editable }='title' class='#{ docClass.editable }'></h1>"
    expect( htmlCompare.compare(template.$template, expected) ).toBe(true)


  describe '#createSnippet()', ->

    it 'returns a snippet', ->
      snippet = template.createSnippet()
      expect(snippet instanceof Snippet).toBe(true)


  describe '#createHtml()', ->

    it 'returns a SnippetElem instance', ->
      snippetElem = template.createHtml()
      expect(snippetElem instanceof SnippetElem).toBe(true)



describe 'Dropdown Template', ->

  template = null
  beforeEach ->
    template = new SnippetTemplate
      name: 'dropdown'
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
    snippet = template.createSnippet()
    expect(snippet instanceof Snippet).toBe(true)


describe 'SnippetTemplate.parseIdentifier()', ->

  it 'parses "bootstrap.title"', ->
    identifier = SnippetTemplate.parseIdentifier('bootstrap.title')
    expect(identifier.namespace).toEqual('bootstrap')
    expect(identifier.name).toEqual('title')


  it 'does not parse "bootstrap"', ->
    identifier = SnippetTemplate.parseIdentifier('title')
    expect(identifier.namespace).toBeUndefined()
    expect(identifier.name).toEqual('title')


  it 'does not parse emtpy string', ->
    identifier = SnippetTemplate.parseIdentifier('')
    expect(identifier).toBeUndefined()


  it 'does not parse undefined', ->
    identifier = SnippetTemplate.parseIdentifier()
    expect(identifier).toBeUndefined()


# SnippetTemplate constructor
describe 'new SnippetTemplate()', ->

  it 'accepts idenfitier param', ->
    template = new SnippetTemplate
      identifier: 'bootstrap.title'
      html: """<h1 #{ docAttr.editable }="title"></h1>"""

    expect(template.namespace).toEqual('bootstrap')
    expect(template.name).toEqual('title')


# Snippet with snippet containers
describe 'Row Template', ->

  template = null
  beforeEach ->
    template = test.getTemplate('row')


  it 'initializes SnippetContainers', ->
    snippet = template.createSnippet()
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
    expect(container.containers.hasOwnProperty('default'))


describe 'Stuffed Container', ->

  it 'removes container content from $template', ->
    stuffedContainer = test.getTemplate('stuffedContainer')
    $container = stuffedContainer.$template.find('.container')
    expect($container.length).toEqual(1)
    expect($container.html()).toEqual('')



