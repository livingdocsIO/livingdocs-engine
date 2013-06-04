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

