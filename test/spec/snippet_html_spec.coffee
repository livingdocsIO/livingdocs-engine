describe 'SnippetHtml', ->

  beforeEach ->
    template = new SnippetTemplate
      name: 'h1'
      html: """<h1 #{ docAttr.editable }="title"></h1>"""

    @snippetHtml = template.createHtml()


  it 'sets title editable', ->
    @snippetHtml.set('title', 'Humble Bundle')

    expected =
      """
      <h1 #{ docAttr.editable }="title"
        class="#{ docClass.editable } #{ docClass.snippet }">
        Humble Bundle
      </h1>
      """

    expect( htmlCompare.compare(@snippetHtml.$html, expected) ).toBe(true)


  it 'sets title editable as default', ->
    @snippetHtml.set('Humble Bundle 2')
    expected =
      """
      <h1 #{ docAttr.editable }="title"
        class="#{ docClass.editable } #{ docClass.snippet }">
        Humble Bundle 2
      </h1>
      """
    expect( htmlCompare.compare(@snippetHtml.$html, expected) ).toBe(true)


  it 'gets the title', ->
    @snippetHtml.set('Games Galore')
    expect( @snippetHtml.get('title') ).toEqual('Games Galore')


  it 'gets the title without params', ->
    @snippetHtml.set('Double Fine')
    expect( @snippetHtml.get() ).toEqual('Double Fine')


