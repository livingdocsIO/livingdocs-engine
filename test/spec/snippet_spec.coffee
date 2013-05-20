describe "H1 Snippet", ->

  # Setup
  # -----
  beforeEach ->
    template = new SnippetTemplate
      name: "h1"
      namespace: "test"
      html: """<h1 #{ docAttr.editable }="title"></h1>"""

    @snippet = new Snippet(template: template)


  # Tests
  # -----

  it "should instantiate", ->
    expect(@snippet).toBeDefined()

  it "should have and identifier", ->
    expect(@snippet.identifier).toEqual("test.h1")



