describe 'SnippetHtml', ->

  beforeEach ->
    template = new SnippetTemplate
      name: 'h1'
      html: """<h1 #{ docAttr.editable }="title"></h1>"""

    @snippetHtml = template.createHtml()


  it 'sets title editable', ->
    @snippetHtml.set('title', 'Humble Bundle')

    expect( @snippetHtml.$html.outerHtml() ).toEqual(
      """
      <h1 #{ docAttr.editable }="title" class="#{ docClass.editable } #{ docClass.snippet }">Humble Bundle</h1>
      """
    )


  it 'sets title editable as default', ->
    @snippetHtml.set('Humble Bundle 2')

    expect( @snippetHtml.$html.outerHtml() ).toEqual(
      """
      <h1 #{ docAttr.editable }="title" class="#{ docClass.editable } #{ docClass.snippet }">Humble Bundle 2</h1>
      """
    )


  it 'gets the title', ->
    @snippetHtml.set('Games Galore')
    expect( @snippetHtml.get('title') ).toEqual('Games Galore')


  it 'gets the title without params', ->
    @snippetHtml.set('Double Fine')
    expect( @snippetHtml.get() ).toEqual('Double Fine')


