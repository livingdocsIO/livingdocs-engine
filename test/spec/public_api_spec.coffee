describe "Public API", ->

  it "defines the global variable doc", ->
    expect(window.doc).toBeDefined()


  it "global variable doc is a function", ->
    expect( $.isFunction(window.doc) ).toBe(true)


  it "defines doc.loadDocument", ->
    expect( window.doc.loadDocument ).toBeDefined()


  it "defines doc.addSnippetCollection", ->
    expect( window.doc.addSnippetCollection ).toBeDefined()
