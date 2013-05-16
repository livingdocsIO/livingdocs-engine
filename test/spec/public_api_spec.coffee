describe "Public API", ->

  it "should define the global variable doc", ->
    expect(window.doc).toBeDefined()

  it "global variable doc should be a function", ->
    expect( $.isFunction(window.doc) ).toBe(true)

  it "should define doc.loadDocument", ->
    expect( window.doc.loadDocument ).toBeDefined()

  it "should define doc.addSnippetCollection", ->
    expect( window.doc.addSnippetCollection ).toBeDefined()
