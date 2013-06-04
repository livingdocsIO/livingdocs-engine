describe "H1 Snippet", ->

  beforeEach ->
    template = new SnippetTemplate
      name: "h1"
      namespace: "test"
      html: """<h1 #{ docAttr.editable }="title"></h1>"""

    @snippet = template.createSnippet()


  it "instantiates from template", ->
    expect(@snippet).toBeDefined()


  it "has an identifier", ->
    expect(@snippet.identifier).toEqual("test.h1")



